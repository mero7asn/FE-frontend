const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

let modelPromise = null;

const loadModel = async () => {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');

    if (!window.cocoSsd) {
      throw new Error('COCO-SSD library failed to initialize on window object.');
    }
    return await window.cocoSsd.load();
  })();

  return modelPromise;
};

export const detectHumanInImage = async (imageFile, threshold = 0.5) => {
  try {
    const reader = new FileReader();
    const predictions = await new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
          try {
            const model = await loadModel();
            const preds = await model.detect(img);
            resolve(preds);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image source.'));
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(imageFile);
    });
    return { detected: false, predictions };
  } catch (error) {
    return { detected: false, predictions: [] };
  }
};
