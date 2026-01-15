import { createClient } from 'jsr:@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { code } = await req.json().catch(() => ({}))
    if (!code) {
      return new Response(JSON.stringify({ message: "缺少code" }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const APP_ID = Deno.env.get("WECHAT_MINIPROGRAM_LOGIN_APP_ID")
    const APP_SECRET = Deno.env.get("WECHAT_MINIPROGRAM_LOGIN_APP_SECRET")

    if (!APP_ID || !APP_SECRET) {
      return new Response(JSON.stringify({ message: "微信小程序配置未设置" }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const wxRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    )
    const wxData = await wxRes.json()

    if (wxData.errcode) {
      return new Response(JSON.stringify({ message: `微信接口错误: ${wxData.errmsg}` }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const { openid } = wxData
    const email = `${openid}@wechat.login`

    const { data: magicLinkData, error: magicLinkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          data: { from: "wechat", openid },
        },
      })

    if (magicLinkError) {
      return new Response(JSON.stringify({ message: magicLinkError.message }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    let hashedToken = magicLinkData?.properties?.hashed_token ?? ""
    if (!hashedToken) {
      return new Response(JSON.stringify({ message: "无法生成token" }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    return new Response(JSON.stringify({
      token: hashedToken,
      openid,
    }), { 
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message || "服务器错误" }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})
