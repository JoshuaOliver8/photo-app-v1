const tags = []

export const addTag = (newName) => {
    const newTag = {
        tagName: newName.trim().replace(/\s/g, '-').toLowerCase(),
        descriptiveName: newName
    }

    tags.push(newTag)
}

export const getTags = () => {
    return tags
}