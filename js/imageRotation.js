// A list of image URLs to randomly choose from
const images = [
    'images/Rotomdex_bigsmile.png',
    'images/Rotomdex_blush.png',
    'images/Rotomdex_frown.png',
    'images/Rotomdex_sleep.png',
    'images/Rotomdex_smile.png',
    'images/Rotomdex_surprise.png',
    'images/Rotomdex_zzzt.png'
];

// Get the image element by its ID
const hoverImageElement = document.getElementById('rotomOverlay');

// Function to randomly select an image and update the src attribute
function changeImage() {
    const randomIndex = Math.floor(Math.random() * images.length);
    const newImageSrc = images[randomIndex];

    // Make sure the new image is not the same as the current one
    // This prevents the image from "flickering" if the same one is chosen
    if (hoverImageElement.src !== newImageSrc) {
        hoverImageElement.src = newImageSrc;
    }
}

// Add event listener for when the mouse cursor enters the image area
hoverImageElement.addEventListener('mouseover', changeImage);
