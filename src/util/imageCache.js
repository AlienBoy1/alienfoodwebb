// Utilidad para descargar y cachear imágenes de platillos
import indexedDBService from "./IndexedDBService";

/**
 * Descarga una imagen desde una URL y la convierte a base64 para almacenamiento offline
 */
async function downloadAndCacheImage(imageUrl, category) {
  try {
    // Verificar si la imagen ya está cacheada
    const existingImages = await indexedDBService.getAllDishImages();
    const existing = existingImages.find(img => img.url === imageUrl);
    
    if (existing && existing.dataUrl) {
      console.log("✅ Imagen ya cacheada:", imageUrl);
      return existing;
    }

    // Descargar la imagen
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error descargando imagen: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Convertir a base64
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Guardar en IndexedDB
    const imageData = {
      url: imageUrl,
      category: category,
      dataUrl: dataUrl,
      cachedAt: new Date().toISOString(),
    };

    await indexedDBService.saveDishImage(imageData);
    console.log("✅ Imagen cacheada exitosamente:", imageUrl);

    return imageData;
  } catch (error) {
    console.error("Error cacheando imagen:", imageUrl, error);
    // Retornar la URL original si falla el cacheo
    return {
      url: imageUrl,
      category: category,
      dataUrl: null,
      error: error.message,
    };
  }
}

/**
 * Descarga y cachea todas las imágenes de los platillos existentes
 */
export async function cacheAllDishImages(dishes) {
  if (!dishes || !Array.isArray(dishes)) {
    console.warn("No hay platillos para cachear imágenes");
    return;
  }

  console.log(`📦 Iniciando cacheo de ${dishes.length} imágenes de platillos...`);

  const cachePromises = dishes.map((dish) => {
    if (dish.image && dish.category) {
      return downloadAndCacheImage(dish.image, dish.category);
    }
    return Promise.resolve(null);
  });

  const results = await Promise.allSettled(cachePromises);
  const successful = results.filter(r => r.status === "fulfilled" && r.value).length;
  const failed = results.length - successful;

  console.log(`✅ Cacheo completado: ${successful} exitosas, ${failed} fallidas`);
  
  return { successful, failed, total: dishes.length };
}

/**
 * Obtiene imágenes cacheadas por categoría
 */
export async function getCachedImagesByCategory(category) {
  try {
    const images = await indexedDBService.getDishImagesByCategory(category);
    return images.map(img => ({
      url: img.url,
      dataUrl: img.dataUrl,
      id: img.id,
    }));
  } catch (error) {
    console.error("Error obteniendo imágenes cacheadas:", error);
    return [];
  }
}

/**
 * Obtiene todas las imágenes cacheadas
 */
export async function getAllCachedImages() {
  try {
    const images = await indexedDBService.getAllDishImages();
    return images.map(img => ({
      url: img.url,
      dataUrl: img.dataUrl,
      category: img.category,
      id: img.id,
    }));
  } catch (error) {
    console.error("Error obteniendo todas las imágenes cacheadas:", error);
    return [];
  }
}

export default {
  cacheAllDishImages,
  getCachedImagesByCategory,
  getAllCachedImages,
  downloadAndCacheImage,
};

