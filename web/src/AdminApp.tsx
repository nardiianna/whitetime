import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { PostForm } from './components/PostForm'
import { WeekCalendar } from './components/WeekCalendar'
import { MonthCalendar } from './components/MonthCalendar'
import { PostList } from './components/PostList'
import { IdeasBank } from './components/IdeasBank'
import { PageForm } from './components/PageForm'
import { CategoryForm } from './components/CategoryForm'
import { errorMessage, useToast, UNDO_DELAY_MS } from './lib/toast'
import type { Page, Post, ContentIdea, Category } from './types'

const ALL = 'all'

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function toDateInputDefault(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T09:00`
}

function matchesSearch(post: Post, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    post.caption.toLowerCase().includes(q) ||
    (post.notes ?? '').toLowerCase().includes(q) ||
    (post.page?.name ?? '').toLowerCase().includes(q) ||
    (post.category?.name ?? '').toLowerCase().includes(q)
  )
}

function AdminApp() {
  const toast = useToast()
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>(ALL)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL)
  const [posts, setPosts] = useState<Post[]>([])
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined)
  const [defaultScheduledAt, setDefaultScheduledAt] = useState<string | undefined>(undefined)
  const [showPageForm, setShowPageForm] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | undefined>(undefined)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()))
  const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'list'>('calendar')
  const [searchQuery, setSearchQuery] = useState('')
  const [failedReminders, setFailedReminders] = useState<Post[]>([])

  const [pendingDeletePostIds, setPendingDeletePostIds] = useState<Set<string>>(new Set())
  const [pendingDeletePageIds, setPendingDeletePageIds] = useState<Set<string>>(new Set())
  const pendingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const duplicatingIds = useRef(new Set<string>())

  useEffect(() => {
    return () => {
      pendingTimers.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const loadPages = useCallback(async () => {
    const { data, error } = await supabase.from('pages').select('*').order('name')
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    setPages(data ?? [])
  }, [toast])

  const loadPosts = useCallback(async () => {
    let query = supabase
      .from('posts')
      .select('*, category:categories(name), page:pages(name, type)')
      .order('scheduled_at')
    if (selectedPageId !== ALL) query = query.eq('page_id', selectedPageId)
    if (selectedCategoryId !== ALL) query = query.eq('category_id', selectedCategoryId)
    const { data, error } = await query
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    setPosts(data ?? [])
  }, [selectedPageId, selectedCategoryId, toast])

  const loadFailedReminders = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, category:categories(name), page:pages(name, type)')
      .not('reminder_error', 'is', null)
      .order('scheduled_at')
    setFailedReminders(data ?? [])
  }, [])

  const loadIdeas = useCallback(async () => {
    if (selectedPageId === ALL) {
      setIdeas([])
      return
    }
    const { data } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('page_id', selectedPageId)
      .order('created_at')
    setIdeas(data ?? [])
  }, [selectedPageId])

  const loadCategories = useCallback(async () => {
    if (selectedPageId === ALL) {
      setCategories([])
      return
    }
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('page_id', selectedPageId)
      .order('name')
    setCategories(data ?? [])
  }, [selectedPageId])

  useEffect(() => {
    loadPages()
    loadFailedReminders()
  }, [loadPages, loadFailedReminders])

  useEffect(() => {
    setSelectedCategoryId(ALL)
  }, [selectedPageId])

  useEffect(() => {
    loadPosts()
    loadIdeas()
    loadCategories()
  }, [loadPosts, loadIdeas, loadCategories])

  function scheduleDelete<T extends { id: string }>(
    item: T,
    label: string,
    idSet: React.Dispatch<React.SetStateAction<Set<string>>>,
    commit: () => Promise<void>,
  ) {
    idSet((prev) => new Set(prev).add(item.id))
    const timer = setTimeout(async () => {
      pendingTimers.current.delete(item.id)
      idSet((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      await commit()
    }, UNDO_DELAY_MS)
    pendingTimers.current.set(item.id, timer)
    toast.undo(label, () => {
      clearTimeout(timer)
      pendingTimers.current.delete(item.id)
      idSet((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    })
  }

  function handleDelete(post: Post) {
    scheduleDelete(post, `"${post.caption.trim().slice(0, 30) || 'Post senza caption'}" eliminato`, setPendingDeletePostIds, async () => {
      if (post.media_paths.length > 0) {
        const { error } = await supabase.storage.from('media').remove(post.media_paths)
        if (error) toast.error('Alcuni file media non sono stati cancellati dallo storage')
      }
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) toast.error(errorMessage(error))
      loadPosts()
    })
  }

  async function handleMarkPublished(post: Post) {
    const { error } = await supabase.from('posts').update({ status: 'pubblicato' }).eq('id', post.id)
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    loadPosts()
  }

  async function handleDuplicate(post: Post) {
    if (duplicatingIds.current.has(post.id)) return
    duplicatingIds.current.add(post.id)
    try {
      const mediaPaths: string[] = []
      for (const path of post.media_paths) {
        const newPath = `${post.page_id}/${crypto.randomUUID()}-${path.split('/').pop()}`
        const { error } = await supabase.storage.from('media').copy(path, newPath)
        if (error) {
          toast.error('Impossibile copiare uno dei file media')
          continue
        }
        mediaPaths.push(newPath)
      }

      const scheduledAt = new Date(post.scheduled_at)
      scheduledAt.setDate(scheduledAt.getDate() + 7)

      const { data, error } = await supabase
        .from('posts')
        .insert({
          page_id: post.page_id,
          category_id: post.category_id,
          caption: post.caption,
          media_paths: mediaPaths,
          scheduled_at: scheduledAt.toISOString(),
          status: 'da_fare',
          notes: post.notes,
        })
        .select('*, category:categories(name), page:pages(name, type)')
        .single()

      if (error) {
        toast.error(errorMessage(error))
        return
      }

      await loadPosts()
      if (data) openEditPost(data)
    } finally {
      duplicatingIds.current.delete(post.id)
    }
  }

  function openNewPageForm() {
    setEditingPage(undefined)
    setShowPageForm(true)
  }

  function openEditPage(page: Page) {
    setEditingPage(page)
    setShowPageForm(true)
  }

  function handlePageDelete(page: Page) {
    if (
      !confirm(
        `Eliminare il cliente "${page.name}"? Verranno eliminati anche tutti i suoi post e le idee salvate. Puoi annullare entro pochi secondi.`,
      )
    )
      return

    setShowPageForm(false)
    setEditingPage(undefined)
    if (selectedPageId === page.id) setSelectedPageId(ALL)

    scheduleDelete(page, `Cliente "${page.name}" eliminato`, setPendingDeletePageIds, async () => {
      const { data: pagePosts } = await supabase.from('posts').select('media_paths').eq('page_id', page.id)
      const mediaToRemove = (pagePosts ?? []).flatMap((p) => p.media_paths ?? [])
      if (mediaToRemove.length > 0) {
        const { error } = await supabase.storage.from('media').remove(mediaToRemove)
        if (error) toast.error('Alcuni file media del cliente non sono stati cancellati dallo storage')
      }
      const { error } = await supabase.from('pages').delete().eq('id', page.id)
      if (error) toast.error(errorMessage(error))
      loadPages()
      loadPosts()
    })
  }

  function openNewCategoryForm() {
    setEditingCategory(undefined)
    setShowCategoryForm(true)
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  async function handleCategoryDelete(category: Category) {
    if (
      !confirm(`Eliminare la categoria "${category.name}"? I post con questa categoria resteranno, senza categoria.`)
    )
      return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    setShowCategoryForm(false)
    setEditingCategory(undefined)
    if (selectedCategoryId === category.id) setSelectedCategoryId(ALL)
    loadCategories()
    loadPosts()
  }

  async function dismissFailedReminder(post: Post) {
    const { error } = await supabase.from('posts').update({ reminder_error: null }).eq('id', post.id)
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    loadFailedReminders()
    loadPosts()
  }

  function openNewPost(date?: Date) {
    setEditingPost(undefined)
    setDefaultScheduledAt(date ? toDateInputDefault(date) : undefined)
    setShowForm(true)
  }

  function openEditPost(post: Post) {
    setEditingPost(post)
    setShowForm(true)
  }

  function goToWeekOf(date: Date) {
    setWeekStart(getMonday(date))
    setViewMode('calendar')
  }

  const visiblePages = pages.filter((p) => !pendingDeletePageIds.has(p.id))
  const visiblePosts = posts.filter((p) => !pendingDeletePostIds.has(p.id) && matchesSearch(p, searchQuery))

  const selectedPage = pages.find((p) => p.id === selectedPageId)
  const isPersonalSelected = selectedPage?.type === 'personal'

  return (
    <>
        {failedReminders.length > 0 && (
          <div className="mb-5 space-y-1.5 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              ⚠️ {failedReminders.length} promemoria Telegram non {failedReminders.length === 1 ? 'inviato' : 'inviati'}
            </p>
            <ul className="space-y-1">
              {failedReminders.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center gap-2 text-xs text-red-700">
                  <span className="font-medium">{post.page?.name ?? 'Cliente'}</span>
                  <span>
                    {new Date(post.scheduled_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="truncate text-red-600" title={post.reminder_error ?? ''}>
                    {post.reminder_error}
                  </span>
                  <button onClick={() => openEditPost(post)} className="font-medium underline">
                    Apri
                  </button>
                  <button onClick={() => dismissFailedReminder(post)} className="font-medium underline">
                    Ignora
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPageId(ALL)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedPageId === ALL
                ? 'bg-neutral-900 text-white shadow-sm '
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Tutte
          </button>
          {visiblePages.map((page) => {
            const isPersonalPage = page.type === 'personal'
            return (
              <div key={page.id} className="flex items-center gap-0.5">
                <button
                  onClick={() => setSelectedPageId(page.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPageId === page.id
                      ? isPersonalPage
                        ? 'bg-personal-500 text-white shadow-sm shadow-personal-300/70'
                        : 'bg-neutral-900 text-white shadow-sm '
                      : isPersonalPage
                        ? 'border border-personal-200 bg-white text-personal-700 hover:bg-personal-50'
                        : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {page.name}
                </button>
                <button
                  onClick={() => openEditPage(page)}
                  className={`rounded-full p-1 text-xs ${
                    isPersonalPage
                      ? 'text-personal-400 hover:text-personal-700'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                  title="Modifica cliente"
                  aria-label={`Modifica ${page.name}`}
                >
                  ✎
                </button>
              </div>
            )
          })}
          <button
            onClick={openNewPageForm}
            className="rounded-full border border-dashed border-neutral-400 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            + Cliente
          </button>
        </div>

        {showPageForm && (
          <div className="mb-5 space-y-3">
            <PageForm
              page={editingPage}
              onSaved={() => {
                setShowPageForm(false)
                setEditingPage(undefined)
                loadPages()
                loadPosts()
              }}
              onCancel={() => {
                setShowPageForm(false)
                setEditingPage(undefined)
              }}
              onDelete={editingPage ? () => handlePageDelete(editingPage) : undefined}
            />
          </div>
        )}

        {selectedPageId !== ALL && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategoryId(ALL)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategoryId === ALL
                  ? isPersonalSelected
                    ? 'bg-personal-200 text-neutral-800'
                    : 'bg-neutral-300 text-neutral-800'
                  : isPersonalSelected
                    ? 'border border-personal-100 bg-white text-personal-600 hover:bg-personal-50'
                    : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              Tutte le categorie
            </button>
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-0.5">
                <button
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategoryId === category.id
                      ? isPersonalSelected
                        ? 'bg-personal-200 text-neutral-800'
                        : 'bg-neutral-300 text-neutral-800'
                      : isPersonalSelected
                        ? 'border border-personal-100 bg-white text-personal-600 hover:bg-personal-50'
                        : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  {category.name}
                </button>
                <button
                  onClick={() => openEditCategory(category)}
                  className={`rounded-full p-1 text-xs ${
                    isPersonalSelected
                      ? 'text-personal-300 hover:text-personal-600'
                      : 'text-neutral-400 hover:text-neutral-800'
                  }`}
                  title="Modifica categoria"
                  aria-label={`Modifica ${category.name}`}
                >
                  ✎
                </button>
              </div>
            ))}
            {showCategoryForm ? (
              <CategoryForm
                pageId={selectedPageId}
                category={editingCategory}
                onSaved={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(undefined)
                  loadCategories()
                  loadPosts()
                }}
                onCancel={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(undefined)
                }}
                onDelete={editingCategory ? () => handleCategoryDelete(editingCategory) : undefined}
              />
            ) : (
              <button
                onClick={openNewCategoryForm}
                className="rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              >
                + Categoria
              </button>
            )}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-neutral-900 text-white shadow-sm ' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Settimana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'month' ? 'bg-neutral-900 text-white shadow-sm ' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Mese
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-neutral-900 text-white shadow-sm ' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Elenco
            </button>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca nei post…"
            className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 sm:max-w-xs"
          />
          <button
            onClick={() => openNewPost()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
          >
            {isPersonalSelected ? '+ Nuovo evento' : '+ Nuovo post'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <PostForm
              pages={pages}
              defaultPageId={selectedPageId !== ALL ? selectedPageId : pages[0]?.id ?? ''}
              post={editingPost}
              defaultScheduledAt={defaultScheduledAt}
              onSaved={() => {
                setShowForm(false)
                loadPosts()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {viewMode === 'calendar' && (
          <WeekCalendar
            posts={visiblePosts}
            weekStart={weekStart}
            onPrevWeek={() => setWeekStart((prev) => addDays(prev, -7))}
            onNextWeek={() => setWeekStart((prev) => addDays(prev, 7))}
            onToday={() => setWeekStart(getMonday(new Date()))}
            onEdit={openEditPost}
            onDelete={handleDelete}
            onMarkPublished={handleMarkPublished}
            onDuplicate={handleDuplicate}
            onQuickAdd={openNewPost}
          />
        )}

        {viewMode === 'month' && (
          <MonthCalendar
            posts={visiblePosts}
            monthStart={monthStart}
            onPrevMonth={() => setMonthStart((prev) => addMonths(prev, -1))}
            onNextMonth={() => setMonthStart((prev) => addMonths(prev, 1))}
            onToday={() => setMonthStart(getMonthStart(new Date()))}
            onDayClick={goToWeekOf}
            onQuickAdd={openNewPost}
          />
        )}

        {viewMode === 'list' && (
          <PostList
            posts={visiblePosts}
            onEdit={openEditPost}
            onDelete={handleDelete}
            onMarkPublished={handleMarkPublished}
            onDuplicate={handleDuplicate}
          />
        )}

        {selectedPageId !== ALL && (
          <div className="mt-6">
            <IdeasBank pageId={selectedPageId} ideas={ideas} onChanged={loadIdeas} />
          </div>
        )}
    </>
  )
}

export default AdminApp
