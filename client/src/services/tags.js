import axios from 'axios'
const baseUrl = '/api/tags'

const getTags = async () => {
    const response = await axios.get(baseUrl)
    return response.data
}

const addTag = async (tag) => {
    const response = await axios.post(baseUrl, tag)
    return response.data
}

export default { getTags, addTag }