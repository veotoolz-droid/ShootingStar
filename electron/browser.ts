import { chromium, Browser, Page, BrowserContext } from 'playwright'
import path from 'path'
import fs from 'fs'

export class PlaywrightBrowser {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private downloadPath: string

  constructor(downloadPath: string = './downloads') {
    this.downloadPath = downloadPath
  }

  async initialize() {
    if (this.browser) return

    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true })
    }

    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    this.page = await this.context.newPage()

    // Handle downloads
    this.page.on('download', async (download) => {
      const downloadPath = path.join(this.downloadPath, download.suggestedFilename())
      await download.saveAs(downloadPath)
      console.log(`Downloaded: ${downloadPath}`)
    })
  }

  async navigate(url: string): Promise<void> {
    await this.initialize()
    if (!this.page) throw new Error('Page not initialized')
    
    await this.page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
  }

  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    
    // Wait for element to be visible and clickable
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 })
    await this.page.click(selector)
  }

  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 })
    await this.page.fill(selector, text)
  }

  async getText(selector?: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized')
    
    if (selector) {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 })
      return await this.page.textContent(selector) || ''
    }
    
    return await this.page.evaluate(() => document.body.innerText)
  }

  async getHtml(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized')
    return await this.page.content()
  }

  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<string> {
    if (!this.page) throw new Error('Page not initialized')
    
    const screenshotPath = options?.path || path.join(this.downloadPath, `screenshot-${Date.now()}.png`)
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? false
    })
    
    return screenshotPath
  }

  async scroll(direction: 'up' | 'down' | 'top' | 'bottom'): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    
    switch (direction) {
      case 'up':
        await this.page.evaluate(() => window.scrollBy(0, -500))
        break
      case 'down':
        await this.page.evaluate(() => window.scrollBy(0, 500))
        break
      case 'top':
        await this.page.evaluate(() => window.scrollTo(0, 0))
        break
      case 'bottom':
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        break
    }
  }

  async findElements(selector: string): Promise<Array<{ tag: string; text: string; attributes: Record<string, string> }>> {
    if (!this.page) throw new Error('Page not initialized')
    
    const elements = await this.page.$$(selector)
    const results = []
    
    for (const element of elements) {
      const tag = await element.evaluate(el => el.tagName.toLowerCase())
      const text = await element.textContent() || ''
      const attributes = await element.evaluate(el => {
        const attrs: Record<string, string> = {}
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value
        }
        return attrs
      })
      
      results.push({ tag, text: text.trim(), attributes })
    }
    
    return results
  }

  async evaluate(script: string): Promise<any> {
    if (!this.page) throw new Error('Page not initialized')
    return await this.page.evaluate(script)
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.waitForSelector(selector, { timeout: timeout || 10000 })
  }

  async waitForNavigation(timeout?: number): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.waitForLoadState('networkidle', { timeout: timeout || 30000 })
  }

  async getUrl(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized')
    return this.page.url()
  }

  async goBack(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.goBack()
  }

  async goForward(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.goForward()
  }

  async reload(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.reload()
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.context = null
      this.page = null
    }
  }
}