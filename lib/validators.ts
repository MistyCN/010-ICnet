export function validateMinecraftId(id: string): { isValid: boolean; error?: string } {
  if (!id) {
    return { isValid: false, error: "游戏 ID 不能为空" };
  }
  const cleanId = id.trim();
  if (cleanId.length < 3 || cleanId.length > 16) {
    return { isValid: false, error: "游戏 ID 长度必须在 3-16 个字符之间" };
  }
  const pattern = /^[A-Za-z0-9_]{3,16}$/;
  if (!pattern.test(cleanId)) {
    return { isValid: false, error: "游戏 ID 只能包含字母、数字和下划线" };
  }
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: "密码不能为空" };
  }
  if (password.length < 6) {
    return { isValid: false, error: "密码长度不能少于 6 个字符" };
  }
  return { isValid: true };
}

export function validateDiscussionTitle(title: string): { isValid: boolean; error?: string } {
  if (!title) {
    return { isValid: false, error: "标题不能为空" };
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length < 4 || cleanTitle.length > 80) {
    return { isValid: false, error: "标题长度必须在 4-80 个字符之间" };
  }
  return { isValid: true };
}

export function validateDiscussionContent(content: string | undefined | null): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: true };
  }
  const cleanContent = content.trim();
  if (cleanContent.length > 3000) {
    return { isValid: false, error: "内容长度最高不能超过 3000 个字符" };
  }
  return { isValid: true };
}

export function validateReplyContent(content: string): { isValid: boolean; error?: string } {
  if (!content) {
    return { isValid: false, error: "回复内容不能为空" };
  }
  const cleanContent = content.trim();
  if (cleanContent.length < 2 || cleanContent.length > 3000) {
    return { isValid: false, error: "回复内容长度必须在 2-3000 个字符之间" };
  }
  return { isValid: true };
}
