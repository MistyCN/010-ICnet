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

// 公共设施清单字段校验
// 领地名用于拼接传送指令 `/res tp <领地名>`，不允许包含空格和特殊字符
export function validateLandName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: "领地名不能为空" };
  }
  const cleanName = name.trim();
  if (cleanName.length < 1 || cleanName.length > 32) {
    return { isValid: false, error: "领地名长度必须在 1-32 个字符之间" };
  }
  if (/\s/.test(cleanName)) {
    return { isValid: false, error: "领地名不能包含空格" };
  }
  return { isValid: true };
}

export function validateFacilityName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: "设施名不能为空" };
  }
  const cleanName = name.trim();
  if (cleanName.length < 1 || cleanName.length > 32) {
    return { isValid: false, error: "设施名长度必须在 1-32 个字符之间" };
  }
  return { isValid: true };
}

export function validateBuilder(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: "建造者不能为空" };
  }
  const cleanName = name.trim();
  if (cleanName.length < 1 || cleanName.length > 32) {
    return { isValid: false, error: "建造者名称长度必须在 1-32 个字符之间" };
  }
  return { isValid: true };
}
