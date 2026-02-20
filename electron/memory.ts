import { ChromaClient, Collection, IncludeEnum } from 'chromadb'
import path from 'path'
import fs from 'fs'
// import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers'

export class MemoryBank {
  private client: ChromaClient
  private collection: Collection | null = null
  private embedder: any | null = null
  private isInitialized = false

  constructor(folderPath: string) {
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }

    // Initialize ChromaDB client (connects to server, default http://localhost:8000)
    this.client = new ChromaClient({
      path: 'http://localhost:8000'
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: 'comet_memory',
        metadata: { description: 'Comet Search memory bank' }
      })

      // Initialize embedder using Xenova transformers (local, no API calls)
      // Using a lightweight model for embeddings
      try {
        const { pipeline } = await import('@xenova/transformers');
        this.embedder = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { quantized: true } // Use quantized model for faster loading
        )
      } catch (e) {
        console.error("Failed to load embeddings model (transformers/onnx). Memory features disabled.", e);
        this.embedder = null;
      }

      this.isInitialized = true
      console.log('Memory bank initialized successfully')
    } catch (error) {
      console.warn('Failed to initialize memory bank (ChromaDB not running?):', error)
      // Do not throw, just disable memory
      this.isInitialized = false
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized')
    }

    const output = await this.embedder(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data)
  }

  async add(
    type: 'conversation' | 'search',
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    try {
      const embedding = await this.generateEmbedding(content)

      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [content],
        metadatas: [{
          type,
          timestamp,
          ...metadata
        }]
      })

      return id
    } catch (error) {
      console.error('Failed to add memory:', error)
      throw error
    }
  }

  async search(query: string, limit: number = 5): Promise<Array<{
    id: string
    content: string
    score: number
    metadata: any
  }>> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    try {
      const embedding = await this.generateEmbedding(query)

      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: limit
      })

      const items: Array<{ id: string; content: string; score: number; metadata: any }> = []

      if (results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          items.push({
            id: results.ids[0][i],
            content: results.documents[0]?.[i] || '',
            score: results.distances?.[0]?.[i] || 0,
            metadata: results.metadatas[0]?.[i] || {}
          })
        }
      }

      return items
    } catch (error) {
      console.error('Failed to search memory:', error)
      throw error
    }
  }

  async getRecent(limit: number = 10): Promise<Array<{
    id: string
    content: string
    timestamp: number
    type: string
  }>> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    try {
      const results = await this.collection.get({
        limit,
        include: ['documents', 'metadatas'] as any
      })

      const items = results.ids.map((id, index) => ({
        id,
        content: results.documents[index] || '',
        timestamp: Number(results.metadatas[index]?.timestamp || 0),
        type: String(results.metadatas[index]?.type || 'unknown')
      }))

      // Sort by timestamp descending
      return items.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to get recent memories:', error)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    try {
      await this.collection.delete({ ids: [id] })
      return true
    } catch (error) {
      console.error('Failed to delete memory:', error)
      return false
    }
  }

  async clear(): Promise<boolean> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    try {
      await this.client.deleteCollection({ name: 'comet_memory' })
      this.collection = await this.client.getOrCreateCollection({
        name: 'comet_memory',
        metadata: { description: 'Comet Search memory bank' }
      })
      return true
    } catch (error) {
      console.error('Failed to clear memory:', error)
      return false
    }
  }

  async getStats(): Promise<{ total: number; conversations: number; searches: number }> {
    if (!this.collection || !this.isInitialized) {
      throw new Error('Memory bank not initialized')
    }

    try {
      const results = await this.collection.get({
        include: ['metadatas'] as any
      })

      let conversations = 0
      let searches = 0

      for (const metadata of results.metadatas) {
        if (metadata?.type === 'conversation') conversations++
        if (metadata?.type === 'search') searches++
      }

      return {
        total: results.ids.length,
        conversations,
        searches
      }
    } catch (error) {
      console.error('Failed to get memory stats:', error)
      return { total: 0, conversations: 0, searches: 0 }
    }
  }

  async close(): Promise<void> {
    // ChromaDB handles its own cleanup
    this.isInitialized = false
    this.collection = null
    this.embedder = null
  }
}