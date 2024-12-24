const API_URL = import.meta.env.VITE_API_URL

export const getImages = async (nextCursor) => {
    const params = new URLSearchParams()

    if(nextCursor) {
        params.append('next_cursor', nextCursor)
    }

    const response = await fetch(`${API_URL}/photos?${params}`)
    const responseJson = await response.json()
    
    return responseJson
}

export const searchImages = async (searchValue, nextCursor) => {
    const params = new URLSearchParams()
    const searchExpression = 'tags=' + searchValue.trim().replace(/\s/g, ' AND tags=')
    params.append(`expression`, searchExpression)
    params.append('max_results', 10)

    if (nextCursor) {
        params.append('next_cursor', nextCursor)
    }

    const response = await fetch(`${API_URL}/search?${params}`)
    const responseJson = await response.json()

    return responseJson
}

export const uploadImage = async (imageFile, tags) => {
    const formData = new FormData()

    formData.append("file", imageFile)

    const tagList = tags.toString()
    formData.append("tags", tagList)

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
    })
    const responseJson = await response.json()

    return responseJson
}