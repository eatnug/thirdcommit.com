export class PostNotFoundError extends Error {
  constructor(slug: string) {
    super(`Post with slug "${slug}" not found`)
    this.name = 'PostNotFoundError'
  }
}

export class PostValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PostValidationError'
  }
}
