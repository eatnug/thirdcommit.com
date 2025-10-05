/**
 * 프레임워크 독립적인 에디터 폼 컨트롤러
 *
 * 이 클래스는 React나 다른 프레임워크에 의존하지 않으며,
 * 순수한 폼 상태 관리 로직만 담당합니다.
 */

export interface EditorFormData {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
}

export type EditorFormField = keyof EditorFormData

export interface EditorFormValidation {
  isValid: boolean
  errors: Partial<Record<EditorFormField, string>>
}

export class EditorFormController {
  /**
   * 필드 업데이트
   */
  updateField<K extends EditorFormField>(
    currentState: EditorFormData,
    field: K,
    value: EditorFormData[K]
  ): EditorFormData {
    return {
      ...currentState,
      [field]: value,
    }
  }

  /**
   * 여러 필드 동시 업데이트
   */
  updateFields(
    currentState: EditorFormData,
    updates: Partial<EditorFormData>
  ): EditorFormData {
    return {
      ...currentState,
      ...updates,
    }
  }

  /**
   * 폼 초기화
   */
  reset(): EditorFormData {
    return {
      title: '',
      description: '',
      tags: '',
      content: '',
      draft: true,
    }
  }

  /**
   * 폼 유효성 검증
   */
  validate(state: EditorFormData): EditorFormValidation {
    const errors: Partial<Record<EditorFormField, string>> = {}

    if (!state.title.trim()) {
      errors.title = 'Title is required'
    }

    if (!state.content.trim()) {
      errors.content = 'Content is required'
    }

    if (state.description.length > 160) {
      errors.description = 'Description must be 160 characters or less'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * 저장 가능 여부
   */
  canSave(state: EditorFormData): boolean {
    return this.validate(state).isValid
  }

  /**
   * 변경사항 존재 여부
   */
  hasChanges(state: EditorFormData): boolean {
    return !!(
      state.title ||
      state.description ||
      state.tags ||
      state.content
    )
  }

  /**
   * 태그 파싱 (comma-separated string -> array)
   */
  parseTags(tagsString: string): string[] {
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }

  /**
   * 태그 직렬화 (array -> comma-separated string)
   */
  serializeTags(tags: string[]): string {
    return tags.join(', ')
  }

  /**
   * description 글자수 체크
   */
  getDescriptionCharCount(description: string): {
    current: number
    max: number
    remaining: number
  } {
    const max = 160
    const current = description.length
    return {
      current,
      max,
      remaining: max - current,
    }
  }

  /**
   * content 라인수 계산
   */
  getContentLineCount(content: string): number {
    return content.split('\n').length
  }
}

// 싱글톤 인스턴스
export const editorFormController = new EditorFormController()
