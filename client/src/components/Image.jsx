import "../index.css"

const Image = ({ image }) => {
    return (
        <a href={image.secure_url}>
           <img
                src={image.secure_url}
                alt={image.public_id} 
            ></img> 
        </a>
    )
}

export default Image