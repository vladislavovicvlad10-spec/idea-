import { NextResponse } from 'next/server'

export function proxy() {
  // Мы временно отключаем строгую блокировку в прокси, 
  // так как она конфликтует с механизмом авторизации Firebase на стороне клиента.
  // Защита страниц теперь работает через useEffect на самих страницах.
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
