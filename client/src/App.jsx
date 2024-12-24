import { useState, useEffect } from 'react';
import { getImages, searchImages, uploadImage } from './services/cloudinary';
import loginService from './services/login'
import tagsService from './services/tags'
import Image from './components/Image';
import fileTypeChecker from "file-type-checker"
import "./index.css"
import Cookies from "js-cookie"

const App = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [imageList, setImageList] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [toolbarToggle, setToolbarToggle] = useState('-')
  const [userLoad, setUserLoad] = useState(false)
  const [searchStatus, setSearchStatus] = useState(false)
  const [newImage, setNewImage] = useState()
  const [showcaseImage, setShowcaseImage] = useState()
  const [allTags, setAllTags] = useState([])
  const [tagList, setTagList] = useState([])
  const [newTag, setNewTag] = useState("")
  const [tag, setTag] = useState("")

  useEffect(() => {
    //const loggedUserJSON = window.localStorage.getItem('loggedUser')
    const loggedUserJSON = Cookies.get('loggedUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
    }
    setUserLoad(true)
  }, [])

  useEffect(() => {
    if (user !== null) {
      const fetchData = async () => {
        const responseJson = await getImages()
        setImageList(responseJson.resources)
        setNextCursor(responseJson.next_cursor)
      }

      const fetchTags = async () => {
        const responseJson = await tagsService.getTags()
        setAllTags(responseJson)
      }
  
      fetchData()
      fetchTags()
    }
  }, [user])

  useEffect(() => {
    if (user !== null) {
      const handleResize = () => {
        if (window.innerWidth >= 960) {
          setToolbarToggle('-')
  
          document.getElementById('collapsed-header').style.display = 'none'
          document.getElementById('expanded-header').style.display = 'grid'
        }
      }
  
      window.addEventListener('resize', handleResize)
  
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [user])

  const handleLoadMoreButton = async () => {
    if(searchStatus) {
      const responseJson = await searchImages(searchValue, nextCursor)

      setImageList((currentImageList) => [
        ...currentImageList,
        ...responseJson.resources
      ])
      setNextCursor(responseJson.next_cursor)
    } else {
      const responseJson = await getImages(nextCursor)

      setImageList((currentImageList) => [
        ...currentImageList, 
        ...responseJson.resources
      ])
      setNextCursor(responseJson.next_cursor)
    }
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault()

    const responseJson = await searchImages(searchValue, null)
    setImageList(responseJson.resources)
    setNextCursor(responseJson.next_cursor)
    setSearchStatus(true)
  }

  const resetForm = async () => {
    const responseJson = await getImages()
    setImageList(responseJson.resources)
    setNextCursor(responseJson.next_cursor)

    setSearchValue('')
    setSearchStatus(false)
  }

  const handleToolbarToggle = () => {
    if (toolbarToggle === '+') {
      setToolbarToggle('-')

      document.getElementById('collapsed-header').style.display = 'none'
      document.getElementById('expanded-header').style.display = 'grid'
    } else if (toolbarToggle === '-') {
      setToolbarToggle('+')

      document.getElementById('collapsed-header').style.display = 'grid'
      document.getElementById('expanded-header').style.display = 'none'
    }
  }

  const openModal = (modalId) => {
    document.querySelector(`#${modalId}`).showModal()
  }

  const closeModal = (modalId) => {
    document.querySelector(`#${modalId}`).close()
  }

  const closeUploadModal = async () => {
    setNewImage(undefined)
    setShowcaseImage(undefined)
    document.getElementById("upload-image-showcase").style.display = "none"
    document.getElementById("upload-tag-sheet").style.display = "none"
    const responseJson = await tagsService.getTags()
    setAllTags(responseJson)

    document.querySelector("#upload-modal").close()
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({
        username, password,
      })

      /*
      window.localStorage.setItem(
        'loggedUser', JSON.stringify(user)
      )
      */
      Cookies.set('loggedUser', JSON.stringify(user))

      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('Wrong username or password')
      setTimeout(() => {
        setErrorMessage("")
      }, 5000)
    }
  }

  const handleLogout = () => {
    window.localStorage.clear()
    setUser(null)
    setImageList([])
    setNextCursor(null)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()
    const types = [
      "png",
      "jpeg",
      "gif",
      "heic",
      "webp",
    ]

    reader.onload = async () => {
      const validImage = fileTypeChecker.validateFileType(reader.result, types)
      
      if (validImage) {
        setShowcaseImage(URL.createObjectURL(event.target.files[0]))
        URL.revokeObjectURL(event.target.files[0])
        setNewImage(event.target.files[0])
        document.getElementById("upload-image-showcase").style.display = "grid"
        document.getElementById("upload-tag-sheet").style.display = "grid"
  
        const responseJson = await tagsService.getTags()
        setAllTags(responseJson)
      } else {
        setErrorMessage("Invalid file type")
        setTimeout(() => {
          setErrorMessage("")
        }, 5000)
      }
    }
    reader.readAsArrayBuffer(file)

    
  }

  const handleTagChange = (tag) => {
    setTag(tag)
    setNewTag("")
  }
  const handleNewTagChange = (tag) => {
    setNewTag(tag)
    setTag("")
    document.querySelector("#upload-tag-dropdown").value = ""
  }

  const addTag = async () => {
    if (tag !== "") {
      const addedTag = {
        tagName: tag.trim().replace(/\s/g, '-').toLowerCase(),
        descriptiveName: tag
      }

      setTagList([
        ...tagList,
        addedTag
      ])
      setTag("")
      document.querySelector("#upload-tag-dropdown").value = ""
      setAllTags(
        allTags.filter(t => t.tagName !== addedTag.tagName)
      )
    } else {
      const databaseTags = await tagsService.getTags()
      if (databaseTags.find(t => t.tagName === newTag.trim().replace(/\s/g, '-').toLowerCase())) {
        setErrorMessage("Tag already exists in database")
        setTimeout(() => {
          setErrorMessage("")
        }, 5000)
        setNewTag("")
      } else {
        const addedTag = {
          tagName: newTag.trim().replace(/\s/g, '-').toLowerCase(),
          descriptiveName: newTag
        }
  
        await tagsService.addTag(addedTag)
        setTagList([
          ...tagList,
          addedTag
        ])
        setNewTag("")
      }
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (tagList.length === 0) {
      await uploadImage(newImage, ["nobody-here"])
    } else {
      const tagStrings = tagList.filter(t => t.tagName)
      await uploadImage(newImage, tagStrings)
    }

    setNewImage(undefined)
    setShowcaseImage(undefined)
    document.getElementById("upload-image-showcase").style.display = "none"
    document.getElementById("upload-tag-sheet").style.display = "none"
    setTagList([])
    document.querySelector("#upload-tag-dropdown").value = ""
    setTag("")
    setNewTag("")
    const responseJson = await getImages()
    setImageList(responseJson.resources)
    setNextCursor(responseJson.next_cursor)
    document.querySelector("#upload-modal").close()
  }

  if (!userLoad) {
    return (
      <div className="loading">loading...</div>
    )
  }

  if (!user) {
    return (
      <main>
        <div className="login">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              value={username}
              onChange={({ target }) => setUsername(target.value)}
              type="text"
              required
              placeholder="Username"
            ></input>
            <input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              type="password"
              required
              placeholder="Password"
            ></input>
            <button type="submit">Log In</button>
          </form>
        </div>
        <div className="login-error">
          {errorMessage}
        </div>
      </main>
    )
  }

  return (
    <>
      <header id="collapsed-header">
        <button 
          className="toolbar-toggle"
          onClick={handleToolbarToggle}
        >
          {toolbarToggle}
        </button>
        <h2>Photo Gallery</h2>
      </header>
      <header id="expanded-header">
        <div id='expanded-header-toggle'>
          <button 
            className="toolbar-toggle"
            id="toolbar-toggle-expanded"
            onClick={handleToolbarToggle}
          >
            {toolbarToggle}
          </button>
          <h2>Photo Gallery</h2>
        </div>
        <button
          className="header-toolbar"
          type="button"
          onClick={() => openModal("upload-modal")}
        >
          Upload
        </button>
        <button
          className="header-toolbar"
          type="button"
          onClick={() => openModal("help-modal")}
        >
          Help
        </button>
        <button
          id="scroll-button"
          className="header-toolbar"
          type="button"
          onClick={() => window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })}
        >
          Scroll to Top
        </button>
        <button
          className="header-toolbar"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>
      <main>
        <dialog id="help-modal" className="modal">
          <p>
            Hi there! This photo gallery shows all the photos currently
            uploaded to the photo database.
          </p>
          <p>
            Scroll down to use the "Load
            More" button to load more images. You can click on an image
            to directly view the image, where you can also easily download
            it by right-clicking on PC or holding down on the image on mobile.
          </p>
          <p>
            You can use the search bar to search for images based on tags. Tags
            in this app are currently based solely on the names of anyone in a
            picture. For instance, a picture with Joshua in it will have Joshua's
            name as a tag.
          </p>
          <p>
            Tags are formatted in all lowercase with dashes instead of spaces. So,
            "Joshua Oliver" would be "joshua-oliver" and so on. To make a correct
            search, type each name like this and separate them with a space.
          </p>
          <p>
            Search example:
          </p>
          <p>joshua-oliver becca-oliver</p>
          <p>This above example would return images with Becca and Joshua in 
            them. Hit the "Clear" button to reset the search and see all images
            again.
          </p>
          <p>
            The "Upload" button on the toolbar lets you upload an image to the
            database. It will open a window like this where you can add an image
            file from your device and select tags for the image. Please try to
            include everyone in the image as a tag!
          </p>
          <p>
            If you cannot find a person's name in the tag list, you can add a
            new tag for them. Each tag should be only one person. Make sure the
            name is spelled correctly.
          </p>
          <p>
            <b>Tags should be written normally when you add them</b>; 
            adding "Joshua Oliver" means writing "Joshua Oliver", in the
            "Add new tag" text field, the app will auto-correct it to
            "joshua-oliver" in the tag database.
          </p>
          <p>
            If a photo has no visible people in it, <b>do not add any tags</b>.
            The system will automatically tag photos with zero tags as 
            "<b>nobody-here</b>"; use this tag to find images with no one in them.
          </p>
          <p>
            If you need anything else or if something isn't working, please let me
            know!
          </p>
          <p>
            - Love, Joshua
          </p>
          <button
            id="close-help-modal"
            className="dialog-close-btn"
            type="button"
            onClick={() => closeModal("help-modal")}
          >
            Close
          </button>
        </dialog>
        <dialog id="upload-modal" className="modal">
          <h2>Upload</h2>
          <form onSubmit={handleUpload} autoComplete="off">
            <label htmlFor="upload-image-input" id="upload-image-label">
              Add Image
            </label>
            <input
              id="upload-image-input"
              name="upload-image-input"
              type="file"
              accept='image/*'
              required
              onChange={handleFileUpload}
            />
            <img id="upload-image-showcase" src={showcaseImage} alt="image here" />
            <div id="upload-tag-sheet">
              <div id="upload-add-tag">
                <select 
                  id="upload-tag-dropdown"
                  name="upload-tag-dropdown"
                  onChange={({ target }) => handleTagChange(target.value)}
                  defaultValue=""
                >
                  <option value="">Select a tag</option>
                  {
                    allTags.length ?
                    allTags.map(tag => (
                      <option key={tag.id} value={tag.descriptiveName}>{tag.descriptiveName}</option>
                    )) :
                    <option value="">Nothing here!</option>
                  }
                </select>
                <input 
                  id="upload-tag-input"
                  type="text"
                  name="addTag"
                  placeholder="Add a new tag"
                  value={newTag}
                  onChange={({ target }) => handleNewTagChange(target.value)}
                />
                <button 
                  id="add-tag-button"
                  type="button"
                  onClick={addTag}
                >
                  +
                </button>
              </div>
              <textarea 
                id="upload-tag-list" 
                readOnly
                value={tagList.map(t => t.tagName)}
              ></textarea>
            </div>
            <div id="upload-error">
                {errorMessage}
            </div>
            <button type="submit">Upload</button>
            <br></br>
          </form>
          <button
            id="close-upload-modal"
            className="dialog-close-btn"
            type="button"
            onClick={() => closeUploadModal()}
          >
            Close
          </button>
        </dialog>
        <form className="search-form" onSubmit={handleFormSubmit}>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            required
            placeholder="Enter a search value"
          ></input>
          <button type="submit">Search</button>
          <button type="button" onClick={resetForm} >Clear</button>
        </form>
        {
          imageList.length !== 0 ?
          <div className="image-grid">
            {imageList.map(image => 
              <Image image={image} key={image.public_id} />
            )}
          </div> :
          <div className="no-results">Nothing was found. Please try again.</div>
        }
        <div className="footer">
          { nextCursor && <button onClick={handleLoadMoreButton}>Load More</button> }
        </div>
      </main>
      
    </>
  )
}

export default App