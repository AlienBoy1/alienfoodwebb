// Imágenes predeterminadas para perfiles de usuario
// URLs de imágenes de avatares/aliens que son dinámicas y complementarias con la aplicación

export const PROFILE_IMAGES = [
  // Aliens y avatares temáticos
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien2&backgroundColor=c7a2f0",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien3&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien4&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien5&backgroundColor=ffd93d",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien6&backgroundColor=6bcf7f",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien7&backgroundColor=4d96ff",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien8&backgroundColor=ff6b6b",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien9&backgroundColor=95e1d3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien10&backgroundColor=f38181",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien11&backgroundColor=a8e6cf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien12&backgroundColor=ffd3a5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien13&backgroundColor=fd79a8",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien14&backgroundColor=fdcb6e",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien15&backgroundColor=6c5ce7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien16&backgroundColor=a29bfe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien17&backgroundColor=00b894",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien18&backgroundColor=00cec9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien19&backgroundColor=0984e3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alien20&backgroundColor=74b9ff",
];

/**
 * Obtiene una imagen de perfil aleatoria
 */
export function getRandomProfileImage() {
  return PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)];
}

/**
 * Obtiene todas las imágenes de perfil disponibles
 */
export function getAllProfileImages() {
  return PROFILE_IMAGES;
}

export default {
  PROFILE_IMAGES,
  getRandomProfileImage,
  getAllProfileImages,
};

