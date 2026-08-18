import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { PostForm } from './components/PostForm'
import { WeekCalendar } from './components/WeekCalendar'
import { PostList } from './components/PostList'
import { IdeasBank } from './components/IdeasBank'
import { PageForm } from './components/PageForm'
import { CategoryForm } from './components/CategoryForm'
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

function toDateInputDefault(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T09:00`
}

function AdminApp() {
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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const loadPages = useCallback(async () => {
    const { data } = await supabase.from('pages').select('*').order('name')
    setPages(data ?? [])
  }, [])

  const loadPosts = useCallback(async () => {
    let query = supabase
      .from('posts')
      .select('*, category:categories(name), page:pages(name, type)')
      .order('scheduled_at')
    if (selectedPageId !== ALL) query = query.eq('page_id', selectedPageId)
    if (selectedCategoryId !== ALL) query = query.eq('category_id', selectedCategoryId)
    const { data } = await query
    setPosts(data ?? [])
  }, [selectedPageId, selectedCategoryId])

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
  }, [loadPages])

  useEffect(() => {
    setSelectedCategoryId(ALL)
  }, [selectedPageId])

  useEffect(() => {
    loadPosts()
    loadIdeas()
    loadCategories()
  }, [loadPosts, loadIdeas, loadCategories])

  async function handleDelete(post: Post) {
    if (!confirm('Eliminare questo post?')) return
    if (post.media_paths.length > 0) {
      const { error } = await supabase.storage.from('media').remove(post.media_paths)
      if (error) console.error('Failed to delete media', error)
    }
    await supabase.from('posts').delete().eq('id', post.id)
    loadPosts()
  }

  async function handleMarkPublished(post: Post) {
    await supabase.from('posts').update({ status: 'pubblicato' }).eq('id', post.id)
    loadPosts()
  }

  async function handleDuplicate(post: Post) {
    const mediaPaths: string[] = []
    for (const path of post.media_paths) {
      const newPath = `${post.page_id}/${crypto.randomUUID()}-${path.split('/').pop()}`
      const { error } = await supabase.storage.from('media').copy(path, newPath)
      if (error) {
        console.error('Failed to copy media', error)
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
      console.error('Failed to duplicate post', error)
      return
    }

    await loadPosts()
    if (data) openEditPost(data)
  }

  function openNewPageForm() {
    setEditingPage(undefined)
    setShowPageForm(true)
  }

  function openEditPage(page: Page) {
    setEditingPage(page)
    setShowPageForm(true)
  }

  async function handlePageDelete(page: Page) {
    if (
      !confirm(
        `Eliminare il cliente "${page.name}"? Verranno eliminati anche tutti i suoi post e le idee salvate. Azione irreversibile.`,
      )
    )
      return

    const { data: pagePosts } = await supabase.from('posts').select('media_paths').eq('page_id', page.id)
    const mediaToRemove = (pagePosts ?? []).flatMap((p) => p.media_paths ?? [])
    if (mediaToRemove.length > 0) {
      const { error } = await supabase.storage.from('media').remove(mediaToRemove)
      if (error) console.error('Failed to delete media for page', error)
    }

    await supabase.from('pages').delete().eq('id', page.id)
    setShowPageForm(false)
    setEditingPage(undefined)
    if (selectedPageId === page.id) setSelectedPageId(ALL)
    loadPages()
    loadPosts()
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
    await supabase.from('categories').delete().eq('id', category.id)
    setShowCategoryForm(false)
    setEditingCategory(undefined)
    if (selectedCategoryId === category.id) setSelectedCategoryId(ALL)
    loadCategories()
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

  const selectedPage = pages.find((p) => p.id === selectedPageId)
  const isPersonalSelected = selectedPage?.type === 'personal'

  return (
    <>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPageId(ALL)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              selectedPageId === ALL
                ? 'bg-brand-300 text-neutral-800'
                : 'border border-brand-200 text-brand-700'
            }`}
          >
            Tutte
          </button>
          {pages.map((page) => {
            const isPersonalPage = page.type === 'personal'
            return (
              <div key={page.id} className="flex items-center gap-0.5">
                <button
                  onClick={() => setSelectedPageId(page.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    selectedPageId === page.id
                      ? isPersonalPage
                        ? 'bg-personal-300 text-neutral-800'
                        : 'bg-brand-300 text-neutral-800'
                      : isPersonalPage
                        ? 'border border-personal-200 text-personal-700'
                        : 'border border-brand-200 text-brand-700'
                  }`}
                >
                  {page.name}
                </button>
                <button
                  onClick={() => openEditPage(page)}
                  className={`rounded-full p-1 text-xs ${
                    isPersonalPage
                      ? 'text-personal-400 hover:text-personal-700'
                      : 'text-brand-400 hover:text-brand-700'
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
            className="rounded-full border border-dashed border-brand-300 px-3 py-1.5 text-sm text-brand-700"
          >
            + Cliente
          </button>
        </div>

        {showPageForm && (
          <div className="mb-4 space-y-3">
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategoryId(ALL)}
              className={`rounded-full px-3 py-1 text-xs ${
                selectedCategoryId === ALL
                  ? isPersonalSelected
                    ? 'bg-personal-200 text-neutral-800'
                    : 'bg-brand-200 text-neutral-800'
                  : isPersonalSelected
                    ? 'border border-personal-100 text-personal-600'
                    : 'border border-brand-100 text-brand-600'
              }`}
            >
              Tutte le categorie
            </button>
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-0.5">
                <button
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selectedCategoryId === category.id
                      ? isPersonalSelected
                        ? 'bg-personal-200 text-neutral-800'
                        : 'bg-brand-200 text-neutral-800'
                      : isPersonalSelected
                        ? 'border border-personal-100 text-personal-600'
                        : 'border border-brand-100 text-brand-600'
                  }`}
                >
                  {category.name}
                </button>
                <button
                  onClick={() => openEditCategory(category)}
                  className={`rounded-full p-1 text-xs ${
                    isPersonalSelected
                      ? 'text-personal-300 hover:text-personal-600'
                      : 'text-brand-300 hover:text-brand-600'
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
                className="rounded-full border border-dashed border-brand-200 px-3 py-1 text-xs text-brand-600"
              >
                + Categoria
              </button>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-full border border-brand-200 p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-full px-3 py-1 text-xs ${
                viewMode === 'calendar' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-full px-3 py-1 text-xs ${
                viewMode === 'list' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
              }`}
            >
              Elenco
            </button>
          </div>
          <button
            onClick={() => openNewPost()}
            className="rounded-md bg-brand-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-brand-400"
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

        {viewMode === 'calendar' ? (
          <WeekCalendar
            posts={posts}
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
        ) : (
          <PostList
            posts={posts}
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
