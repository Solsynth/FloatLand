import type { Post, FileAttachment, Publisher, Category } from '~/types/post'
import type { Realm } from '~/types/realm'

export interface ComposeAttachment {
	id: string
	file: File
	preview?: string | null
	progress?: number
	uploaded?: boolean
	cloudFile?: FileAttachment
}

export interface ComposeDraft {
	id: string
	title: string
	description: string
	content: string
	slug: string
	visibility: number
	language: string | null
	tags: string[]
	categories: Category[]
	realmId: string | null
	attachments: ComposeAttachment[]
	updatedAt: Date
}

export interface ComposeInitialState {
	title?: string
	description?: string
	content?: string
	slug?: string
	visibility?: number
	language?: string | null
	tags?: string[]
	categories?: Category[]
	realmId?: string | null
	attachments?: FileAttachment[]
	replyingTo?: Post
	forwardingTo?: Post
	chainingTo?: Post
	originalPost?: Post
}

const DRAFTS_STORAGE_KEY = 'compose_drafts'
const AUTO_SAVE_MS = 3000

let autoSaveInterval: ReturnType<typeof setInterval> | null = null

function generateDraftId(): string {
	return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function generateAttachmentId(): string {
	return `attach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function useCompose() {
	// Shared compose state (single instance across the app)
	const title = useState('compose:title', () => '')
	const description = useState('compose:description', () => '')
	const content = useState('compose:content', () => '')
	const slug = useState('compose:slug', () => '')
	const visibility = useState<number>('compose:visibility', () => 0)
	const language = useState<string | null>('compose:language', () => null)
	const tags = useState<string[]>('compose:tags', () => [])
	const categories = useState<Category[]>('compose:categories', () => [])
	const realmId = useState<string | null>('compose:realmId', () => null)
	const realm = useState<Realm | null>('compose:realm', () => null)

	const attachments = useState<ComposeAttachment[]>('compose:attachments', () => [])
	const uploadingAttachments = useState<Set<string>>(
		'compose:uploadingAttachments',
		() => new Set(),
	)

	const publishers = useState<Publisher[]>('compose:publishers', () => [])
	const currentPublisher = useState<Publisher | null>('compose:currentPublisher', () => null)

	const submitting = useState('compose:submitting', () => false)
	const lastSaved = useState<Date | null>('compose:lastSaved', () => null)
	const isDirty = useState('compose:isDirty', () => false)

	const originalPost = useState<Post | null>('compose:originalPost', () => null)
	const replyingTo = useState<Post | undefined>('compose:replyingTo', () => undefined)
	const forwardingTo = useState<Post | undefined>('compose:forwardingTo', () => undefined)
	const chainingTo = useState<Post | undefined>('compose:chainingTo', () => undefined)

	const drafts = useState<Record<string, ComposeDraft>>('compose:drafts', () => ({}))
	const currentDraftId = useState<string | null>('compose:currentDraftId', () => null)
	const draftsHydrated = useState('compose:draftsHydrated', () => false)

	const hasContent = computed(
		() =>
			title.value.trim().length > 0 ||
			description.value.trim().length > 0 ||
			content.value.trim().length > 0 ||
			attachments.value.length > 0,
	)

	const isEmpty = computed(() => !hasContent.value)

	const draftList = computed(() =>
		Object.values(drafts.value).sort(
			(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
		),
	)

	const canSubmit = computed(
		() => hasContent.value && !submitting.value && currentPublisher.value !== null,
	)

	const visibilityLabel = computed(() => {
		switch (visibility.value) {
			case 0:
				return { label: 'Public', icon: 'IconGlobe', tone: 'badge-success' }
			case 1:
				return { label: 'Friends', icon: 'IconUsers', tone: 'badge-info' }
			case 2:
				return { label: 'Unlisted', icon: 'IconEyeOff', tone: 'badge-warning' }
			case 3:
				return { label: 'Private', icon: 'IconLock', tone: 'badge-neutral' }
			default:
				return { label: 'Public', icon: 'IconGlobe', tone: 'badge-success' }
		}
	})

	function saveDraftsToStorage() {
		if (!import.meta.client) return
		try {
			// Attachments with File blobs cannot be serialized; keep cloud-only metadata
			const serializable: Record<string, ComposeDraft> = {}
			for (const [id, draft] of Object.entries(drafts.value)) {
				serializable[id] = {
					...draft,
					attachments: draft.attachments
						.filter((a) => a.cloudFile)
						.map((a) => ({
							id: a.id,
							file: new File([], a.cloudFile?.name || 'file'),
							uploaded: true,
							cloudFile: a.cloudFile,
							preview: a.cloudFile?.url,
						})),
				}
			}
			localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(serializable))
		} catch (e) {
			console.error('Failed to save drafts:', e)
		}
	}

	function loadDraftsFromStorage() {
		if (!import.meta.client || draftsHydrated.value) return
		try {
			const saved = localStorage.getItem(DRAFTS_STORAGE_KEY)
			if (saved) {
				const parsed = JSON.parse(saved) as Record<string, ComposeDraft>
				drafts.value = Object.fromEntries(
					Object.entries(parsed).map(([k, v]) => [
						k,
						{
							...v,
							slug: v.slug ?? '',
							realmId: v.realmId ?? null,
							categories: v.categories ?? [],
							attachments: (v.attachments ?? []).map((a) => ({
								...a,
								file: new File([], a.cloudFile?.name || a.file?.name || 'file'),
							})),
							updatedAt: new Date(v.updatedAt),
						},
					]),
				)
			}
		} catch (e) {
			console.error('Failed to load drafts:', e)
		} finally {
			draftsHydrated.value = true
		}
	}

	function saveDraft(draft: ComposeDraft) {
		drafts.value = { ...drafts.value, [draft.id]: draft }
		saveDraftsToStorage()
	}

	function deleteDraft(id: string) {
		const { [id]: _, ...rest } = drafts.value
		drafts.value = rest
		if (currentDraftId.value === id) currentDraftId.value = null
		saveDraftsToStorage()
	}

	function loadDraft(id: string): ComposeDraft | undefined {
		return drafts.value[id]
	}

	function clearDrafts() {
		drafts.value = {}
		currentDraftId.value = null
		saveDraftsToStorage()
	}

	function startAutoSave() {
		stopAutoSave()
		autoSaveInterval = setInterval(() => {
			if (isDirty.value && hasContent.value) {
				saveCurrentDraft()
			}
		}, AUTO_SAVE_MS)
	}

	function stopAutoSave() {
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval)
			autoSaveInterval = null
		}
	}

	function saveCurrentDraft() {
		if (!hasContent.value) return

		const draftId = currentDraftId.value || generateDraftId()
		currentDraftId.value = draftId

		const draft: ComposeDraft = {
			id: draftId,
			title: title.value,
			description: description.value,
			content: content.value,
			slug: slug.value,
			visibility: visibility.value,
			language: language.value,
			tags: [...tags.value],
			categories: [...categories.value],
			realmId: realmId.value,
			attachments: [...attachments.value],
			updatedAt: new Date(),
		}

		saveDraft(draft)
		lastSaved.value = new Date()
		isDirty.value = false
	}

	function applyDraft(draft: ComposeDraft) {
		title.value = draft.title
		description.value = draft.description
		content.value = draft.content
		slug.value = draft.slug || ''
		visibility.value = draft.visibility
		language.value = draft.language
		tags.value = [...draft.tags]
		categories.value = [...(draft.categories || [])]
		realmId.value = draft.realmId ?? null
		attachments.value = [...draft.attachments]
		currentDraftId.value = draft.id
		isDirty.value = false
		lastSaved.value = draft.updatedAt
	}

	function addAttachment(file: File) {
		const id = generateAttachmentId()
		const attachment: ComposeAttachment = {
			id,
			file,
			uploaded: false,
		}

		if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
			attachment.preview = URL.createObjectURL(file)
		}

		attachments.value = [...attachments.value, attachment]
		isDirty.value = true
		return id
	}

	function addAttachments(files: FileList | File[] | null) {
		if (!files) return
		const list = Array.from(files)
		list.forEach((file) => addAttachment(file))
	}

	function removeAttachment(id: string) {
		const index = attachments.value.findIndex((a) => a.id === id)
		if (index === -1) return

		const attachment = attachments.value[index]
		if (!attachment) return
		if (attachment.preview) {
			URL.revokeObjectURL(attachment.preview)
		}

		attachments.value = attachments.value.filter((a) => a.id !== id)
		isDirty.value = true
	}

	function updateAttachmentProgress(id: string, progress: number) {
		const next = attachments.value.map((a) =>
			a.id === id ? { ...a, progress } : a,
		)
		attachments.value = next
	}

	function setAttachmentUploaded(id: string, cloudFile: FileAttachment) {
		attachments.value = attachments.value.map((a) =>
			a.id === id
				? { ...a, uploaded: true, cloudFile, progress: 100 }
				: a,
		)
	}

	function moveAttachment(index: number, direction: 'up' | 'down') {
		const newIndex = direction === 'up' ? index - 1 : index + 1
		if (newIndex < 0 || newIndex >= attachments.value.length) return

		const next = [...attachments.value]
		const temp = next[index]
		next[index] = next[newIndex]!
		next[newIndex] = temp!
		attachments.value = next
		isDirty.value = true
	}

	function addTag(tag: string) {
		const normalized = tag.trim().toLowerCase().replace(/^#/, '')
		if (normalized && !tags.value.includes(normalized)) {
			tags.value = [...tags.value, normalized]
			isDirty.value = true
		}
	}

	function removeTag(tag: string) {
		tags.value = tags.value.filter((t) => t !== tag)
		isDirty.value = true
	}

	function setTags(newTags: string[]) {
		tags.value = [...newTags]
		isDirty.value = true
	}

	function addCategory(category: Category) {
		if (!categories.value.find((c) => c.id === category.id)) {
			categories.value = [...categories.value, category]
			isDirty.value = true
		}
	}

	function removeCategory(categoryId: string) {
		categories.value = categories.value.filter((c) => c.id !== categoryId)
		isDirty.value = true
	}

	function toggleCategory(category: Category) {
		const exists = categories.value.find((c) => c.id === category.id)
		if (exists) removeCategory(category.id)
		else addCategory(category)
	}

	function setCategories(newCategories: Category[]) {
		categories.value = [...newCategories]
		isDirty.value = true
	}

	function setRealm(next: Realm | null) {
		realm.value = next
		realmId.value = next?.id ?? null
		isDirty.value = true
	}

	function setPublishers(newPublishers: Publisher[]) {
		publishers.value = newPublishers
		if (!currentPublisher.value && newPublishers.length > 0) {
			currentPublisher.value = newPublishers[0] ?? null
		}
	}

	function setCurrentPublisher(publisher: Publisher | null) {
		currentPublisher.value = publisher
	}

	function initializeFromState(state: ComposeInitialState | null) {
		title.value = state?.title ?? ''
		description.value = state?.description ?? ''
		content.value = state?.content ?? ''
		slug.value = state?.slug ?? ''
		visibility.value = state?.visibility ?? 0
		language.value = state?.language ?? null
		tags.value = state?.tags ?? []
		categories.value = state?.categories ?? []
		realmId.value = state?.realmId ?? null
		replyingTo.value = state?.replyingTo
		forwardingTo.value = state?.forwardingTo
		chainingTo.value = state?.chainingTo
		originalPost.value = state?.originalPost ?? null

		if (state?.attachments) {
			attachments.value = state.attachments.map((att) => ({
				id: generateAttachmentId(),
				file: new File([], att.name),
				uploaded: true,
				cloudFile: att,
				preview: att.url,
			}))
		} else {
			attachments.value = []
		}

		currentDraftId.value = null
		isDirty.value = false
	}

	function initializeFromPost(post: Post) {
		originalPost.value = post
		title.value = post.title ?? ''
		description.value = post.description ?? ''
		content.value = post.content
		slug.value = ''
		visibility.value = post.visibility
		language.value = null
		tags.value = post.tags.map((t) => t.slug)
		categories.value = []
		realmId.value = null
		realm.value = null
		replyingTo.value = post.repliedPost ?? undefined
		forwardingTo.value = post.forwardedPost ?? undefined
		chainingTo.value = undefined

		attachments.value = post.attachments.map((att) => ({
			id: generateAttachmentId(),
			file: new File([], att.name),
			uploaded: true,
			cloudFile: att,
			preview: att.url,
		}))

		currentDraftId.value = null
		isDirty.value = false
	}

	function initializeEmpty() {
		title.value = ''
		description.value = ''
		content.value = ''
		slug.value = ''
		visibility.value = 0
		language.value = null
		tags.value = []
		categories.value = []
		realmId.value = null
		realm.value = null
		attachments.value = []
		replyingTo.value = undefined
		forwardingTo.value = undefined
		chainingTo.value = undefined
		originalPost.value = null
		currentDraftId.value = null
		isDirty.value = false
	}

	function reset() {
		attachments.value.forEach((att) => {
			if (att.preview) URL.revokeObjectURL(att.preview)
		})

		title.value = ''
		description.value = ''
		content.value = ''
		slug.value = ''
		visibility.value = 0
		language.value = null
		tags.value = []
		categories.value = []
		realmId.value = null
		realm.value = null
		attachments.value = []
		submitting.value = false
		originalPost.value = null
		replyingTo.value = undefined
		forwardingTo.value = undefined
		chainingTo.value = undefined
		currentDraftId.value = null
		lastSaved.value = null
		isDirty.value = false
		uploadingAttachments.value = new Set()
	}

	function markDirty() {
		isDirty.value = true
	}

	// Hydrate drafts once on client
	if (import.meta.client) {
		loadDraftsFromStorage()
	}

	return {
		title,
		description,
		content,
		slug,
		visibility,
		language,
		tags,
		categories,
		realmId,
		realm,
		attachments,
		uploadingAttachments,
		publishers,
		currentPublisher,
		submitting,
		lastSaved,
		isDirty,
		originalPost,
		replyingTo,
		forwardingTo,
		chainingTo,
		drafts,
		currentDraftId,

		hasContent,
		isEmpty,
		draftList,
		canSubmit,
		visibilityLabel,

		generateDraftId,
		saveDraft,
		deleteDraft,
		loadDraft,
		clearDrafts,
		saveCurrentDraft,
		applyDraft,
		startAutoSave,
		stopAutoSave,

		addAttachment,
		addAttachments,
		removeAttachment,
		updateAttachmentProgress,
		setAttachmentUploaded,
		moveAttachment,

		addTag,
		removeTag,
		setTags,

		addCategory,
		removeCategory,
		toggleCategory,
		setCategories,

		setRealm,
		setPublishers,
		setCurrentPublisher,

		initializeFromState,
		initializeFromPost,
		initializeEmpty,
		reset,
		markDirty,
	}
}
