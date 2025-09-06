// A list of image URLs to randomly choose from
const images = [
    'images/rotomdex_closed_eyes_overlay.png',
    'images/rotomdex_drowsy_eyes_overlay.png',
    'images/rotomdex_overlay_mouth_blushing.png',
    'images/rotomdex_overlay_mouth_blushing.png',
    'images/rotomdex_overlay_mouth_bothered_noblush.png',
    'images/rotomdex_overlay_mouth_frown.png',
    'images/rotomdex_overlay_mouth_frownNoTeeth.png',
    'images/rotomdex_overlay_mouth_grin.png',
    'images/rotomdex_overlay_mouth_shock.png',
    'images/rotomdex_overlay_mouth_slightfrown.png',
    'images/rotomdex_overlay_mouth_smile.png',
    'images/rotomdex_overlay_mouth_smileNoTeeth.png',
    'images/rotomdex_overlay_mouth_talking.png',
    'images/rotomdex_overlay_mouth_talking.png'
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
