const baseStyle = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; color: #333; }
  .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 600; }
  .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
  .body { padding: 28px 24px; }
  .body p { margin: 0 0 16px; line-height: 1.7; font-size: 15px; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .info-table td:first-child { color: #888; width: 90px; }
  .info-table td:last-child { color: #333; font-weight: 500; }
  .divider { height: 1px; background: #e8e8e8; margin: 24px 0; }
  .btn-row { text-align: center; margin: 24px 0; }
  .btn { display: inline-block; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; margin: 0 8px; }
  .btn-approve { background: #22c55e; color: #fff; }
  .btn-approve:hover { background: #16a34a; }
  .btn-reject { background: #ef4444; color: #fff; }
  .btn-reject:hover { background: #dc2626; }
  .footer { padding: 20px 24px; text-align: center; background: #fafafa; border-top: 1px solid #f0f0f0; }
  .footer p { margin: 0; font-size: 12px; color: #aaa; }
  .alert { padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
  .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .alert-warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  .code { font-family: 'SF Mono', 'Monaco', 'Menlo', monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 13px; }
`

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrap(title: string, content: string, withFooter = true): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head><body>
<div class="container">
  <div class="header"><h1>${title}</h1></div>
  <div class="body">${content}</div>
  ${withFooter ? `<div class="footer"><p>此邮件由同学录系统自动发送 &copy; ${year}</p></div>` : ''}
</div></body></html>`
}

export function newApplicationEmail(params: {
  realName: string
  username: string
  email: string
  appliedAt: string
  ipLocation: string
  approveUrl: string
  rejectUrl: string
}): string {
  const content = `
<p>管理员您好，有新的注册申请需要您审核：</p>
<table class="info-table">
  <tr><td>申请人</td><td>${escapeHtml(params.realName)}</td></tr>
  <tr><td>系统用户名</td><td><span class="code">${escapeHtml(params.username)}</span></td></tr>
  <tr><td>联系邮箱</td><td>${escapeHtml(params.email || '未填写')}</td></tr>
  <tr><td>申请时间</td><td>${escapeHtml(params.appliedAt)}</td></tr>
  <tr><td>IP 归属地</td><td>${escapeHtml(params.ipLocation)}</td></tr>
</table>
<div class="divider"></div>
<div class="btn-row">
  <a href="${escapeHtml(params.approveUrl)}" class="btn btn-approve">同意申请</a>
  <a href="${escapeHtml(params.rejectUrl)}" class="btn btn-reject">拒绝申请</a>
</div>
<p style="font-size:13px;color:#999;">点击按钮后将跳转到结果确认页面，系统会自动通知申请人审核结果。</p>
`
  return wrap('新的注册申请', content)
}

export function applicationApprovedUserEmail(params: {
  realName: string
  username: string
  password: string
  loginUrl: string
}): string {
  const content = `
<div class="alert alert-success">
  恭喜！您的同学录注册申请已<strong>通过审核</strong>，欢迎加入班级同学录！
</div>
<p>尊敬的同学：</p>
<p>您的注册申请已通过管理员审核，现在可以登录同学录了。</p>
<table class="info-table">
  <tr><td>姓名</td><td>${escapeHtml(params.realName)}</td></tr>
  <tr><td>用户名</td><td><span class="code">${escapeHtml(params.username)}</span></td></tr>
  <tr><td>密码</td><td><span class="code">${escapeHtml(params.password)}</span></td></tr>
</table>
<p style="font-size:13px;color:#888;border-left:3px solid #e8e8e8;padding:6px 12px;margin:16px 0;background:#fafafa;border-radius:0 6px 6px 0;">
  提示：登录密码为您申请注册时填写的密码，请妥善保管。
</p>
<div class="btn-row">
  <a href="${escapeHtml(params.loginUrl)}" class="btn btn-approve">立即登录</a>
</div>
<p style="text-align:center;font-size:12px;color:#aaa;">如果按钮无法点击，请复制以下链接到浏览器打开：</p>
<p style="text-align:center;font-size:12px;color:#999;word-break:break-all;"><span class="code">${escapeHtml(params.loginUrl)}</span></p>
`
  return wrap('注册申请已通过', content)
}

export function applicationRejectedUserEmail(params: {
  realName: string
}): string {
  const content = `
<div class="alert alert-error">
  很遗憾，${escapeHtml(params.realName)} 同学的注册申请<strong>未通过审核</strong>。
</div>
<p>如果您认为这是一次误判，请联系班级管理员进一步了解详情。</p>
`
  return wrap('注册申请未通过', content)
}

export function emailVerificationCodeEmail(params: {
  code: string
  purpose: string
}): string {
  const content = `
<p>您正在进行邮箱${escapeHtml(params.purpose)}验证：</p>
<p style="text-align:center;font-size:28px;font-weight:700;letter-spacing:6px;color:#6366f1;padding:20px 0;">${escapeHtml(params.code)}</p>
<p style="text-align:center;font-size:13px;color:#999;">验证码 10 分钟内有效，请勿泄露。</p>
`
  return wrap('邮箱验证码', content)
}

export function approvalSuccessPage(title: string, message: string): string {
  const content = `
<div class="alert alert-success">${escapeHtml(message)}</div>
<p style="text-align:center;font-size:14px;color:#666;">您可以关闭此页面。</p>
`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head><body>
<div class="container"><div class="header"><h1>${escapeHtml(title)}</h1></div><div class="body">${content}</div></div></body></html>`
}

export function approvalConfirmPage(
  action: 'approve' | 'reject',
  realName: string,
  postUrl: string
): string {
  const isApprove = action === 'approve'
  const btnClass = isApprove ? 'btn-approve' : 'btn-reject'
  const btnText = isApprove ? '确认同意申请' : '确认拒绝申请'
  const tipText = isApprove
    ? `点击确认后，「${escapeHtml(realName)}」的注册申请将被通过，该同学即可登录系统。`
    : `点击确认后，「${escapeHtml(realName)}」的注册申请将被拒绝，该同学将无法登录系统。`
  const content = `
<div class="alert alert-warning">${tipText}</div>
<form method="POST" action="${escapeHtml(postUrl)}" style="text-align:center;margin-top:16px;">
  <button type="submit" class="btn ${btnClass}">${btnText}</button>
</form>
<p style="text-align:center;font-size:13px;color:#999;margin-top:8px;">如非本人操作，请忽略此邮件。</p>
`
  const title = isApprove ? '同意注册申请' : '拒绝注册申请'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head><body>
<div class="container"><div class="header"><h1>${escapeHtml(title)}</h1></div><div class="body">${content}</div></div></body></html>`
}
