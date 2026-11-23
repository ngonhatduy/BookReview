import { ref } from 'vue'
import { SEED_BOOKS } from '../data/seedBooks'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Book, BookInput } from '../types/book'

const DEMO_STORAGE_KEY = 'bookweb_demo_books_v1'
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const BOOK_COLUMNS = 'id, title, cover_url, genres, rating, finished_at, shopee_url, created_at'
const LEGACY_BOOK_COLUMNS = 'id, title, cover_url, genres, rating, finished_at, created_at'

const books = ref<Book[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const isDemoMode = ref<boolean>(!isSupabaseConfigured)

let loadedOnce = false

function loadDemoBooks(): Book[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...(item as Book),
          shopee_url: (item as Partial<Book>).shopee_url ?? null,
        }))
      }
    }
  } catch {
    // Fallback to seed data if localStorage is invalid
  }
  return [...SEED_BOOKS]
}

function saveDemoBooks(items: Book[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.warn('Không thể lưu dữ liệu demo vào localStorage:', err)
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'))
    reader.readAsDataURL(file)
  })
}

export function useBooks() {
  async function fetchBooks(): Promise<void> {
    error.value = null
    if (!supabase) {
      isDemoMode.value = true
      books.value = loadDemoBooks()
      loadedOnce = true
      return
    }

    loading.value = true
    try {
      const { data, error: fetchErr } = await supabase
        .from('books')
        .select(BOOK_COLUMNS)
        .order('finished_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (fetchErr) {
        const errCode = (fetchErr as { code?: string }).code
        if (errCode === '42703' || fetchErr.message.includes('shopee_url')) {
          const { data: legacyData, error: legacyErr } = await supabase
            .from('books')
            .select(LEGACY_BOOK_COLUMNS)
            .order('finished_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })

          if (legacyErr) throw legacyErr
          books.value = ((legacyData as Omit<Book, 'shopee_url'>[]) ?? []).map((item) => ({
            ...item,
            shopee_url: null,
          }))
          loadedOnce = true
          return
        }
        throw fetchErr
      }

      books.value = (data as Book[]) ?? []
      loadedOnce = true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Không thể tải danh sách sách từ cơ sở dữ liệu.'
    } finally {
      loading.value = false
    }
  }

  async function uploadCover(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP...).')
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      throw new Error('Ảnh bìa vượt quá dung lượng tối đa 5 MB.')
    }

    if (!supabase) {
      return await readFileAsDataUrl(file)
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = extension.replace(/[^a-z0-9]/g, '') || 'jpg'
    const filePath = `covers/${crypto.randomUUID()}.${safeExt}`

    const { error: uploadErr } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadErr) {
      throw new Error(`Lỗi tải ảnh bìa: ${uploadErr.message}`)
    }

    const { data } = supabase.storage.from('book-covers').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function addBook(input: BookInput): Promise<Book> {
    const cleanShopeeUrl = input.shopee_url?.trim() || null
    if (!supabase) {
      const created: Book = {
        id: `demo-${crypto.randomUUID()}`,
        title: input.title.trim(),
        cover_url: input.cover_url?.trim() || null,
        genres: input.genres,
        rating: input.rating,
        finished_at: input.finished_at || null,
        shopee_url: cleanShopeeUrl,
        created_at: new Date().toISOString(),
      }
      books.value = [created, ...books.value]
      saveDemoBooks(books.value)
      return created
    }

    const { data, error: insertErr } = await supabase
      .from('books')
      .insert({
        title: input.title.trim(),
        cover_url: input.cover_url?.trim() || null,
        genres: input.genres,
        rating: input.rating,
        finished_at: input.finished_at || null,
        shopee_url: cleanShopeeUrl,
      })
      .select(BOOK_COLUMNS)
      .single()

    if (insertErr) {
      throw new Error(`Không thể thêm sách: ${insertErr.message}`)
    }

    const created = data as Book
    books.value = [created, ...books.value]
    return created
  }

  async function updateBook(id: string, input: BookInput): Promise<Book> {
    const cleanShopeeUrl = input.shopee_url?.trim() || null
    if (!supabase) {
      const idx = books.value.findIndex((b) => b.id === id)
      if (idx === -1) throw new Error('Không tìm thấy cuốn sách cần sửa.')
      const updated: Book = {
        ...books.value[idx],
        title: input.title.trim(),
        cover_url: input.cover_url?.trim() || null,
        genres: input.genres,
        rating: input.rating,
        finished_at: input.finished_at || null,
        shopee_url: cleanShopeeUrl,
      }
      books.value = books.value.map((b) => (b.id === id ? updated : b))
      saveDemoBooks(books.value)
      return updated
    }

    const { data, error: updateErr } = await supabase
      .from('books')
      .update({
        title: input.title.trim(),
        cover_url: input.cover_url?.trim() || null,
        genres: input.genres,
        rating: input.rating,
        finished_at: input.finished_at || null,
        shopee_url: cleanShopeeUrl,
      })
      .eq('id', id)
      .select(BOOK_COLUMNS)
      .single()

    if (updateErr) {
      throw new Error(`Không thể cập nhật sách: ${updateErr.message}`)
    }

    const updated = data as Book
    books.value = books.value.map((b) => (b.id === id ? updated : b))
    return updated
  }

  async function deleteBook(id: string): Promise<void> {
    if (!supabase) {
      books.value = books.value.filter((b) => b.id !== id)
      saveDemoBooks(books.value)
      return
    }

    const { error: deleteErr } = await supabase.from('books').delete().eq('id', id)
    if (deleteErr) {
      throw new Error(`Không thể xóa sách: ${deleteErr.message}`)
    }
    books.value = books.value.filter((b) => b.id !== id)
  }

  function resetDemoBooks(): void {
    if (supabase) return
    books.value = [...SEED_BOOKS]
    saveDemoBooks(books.value)
  }

  if (!loadedOnce) {
    void fetchBooks()
  }

  return {
    books,
    loading,
    error,
    isDemoMode,
    fetchBooks,
    uploadCover,
    addBook,
    updateBook,
    deleteBook,
    resetDemoBooks,
  }
}
