// 폰 카메라 원본 사진은 보통 3~10MB라 Vercel 서버리스 함수의 요청 크기
// 제한(413 Payload Too Large)에 걸리기 쉬워요. 서버로 보내기 전에
// 캔버스로 리사이즈 + JPEG 재압축해서 용량을 확 줄입니다.
const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.8

export function resizeAndEncode(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mediaType: 'image/jpeg' })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 불러오지 못했어요.'))
    }

    img.src = objectUrl
  })
}