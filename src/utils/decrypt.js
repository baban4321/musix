import CryptoJS from "crypto-js";

export function createDownloadLinks(encryptedMediaUrl) {
  if (!encryptedMediaUrl) return [];

  const qualities = [
    { id: "_12", bitrate: "12kbps" },
    { id: "_48", bitrate: "48kbps" },
    { id: "_96", bitrate: "96kbps" },
    { id: "_160", bitrate: "160kbps" },
    { id: "_320", bitrate: "320kbps" },
  ];

  const key = "38346591";

  try {
    const decrypted = CryptoJS.DES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl),
      },
      CryptoJS.enc.Utf8.parse(key),
      { mode: CryptoJS.mode.ECB }
    );

    const decryptedLink = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedLink) return [];

    return qualities.map(({ id, bitrate }) => ({
      quality: bitrate,
      link: decryptedLink.replace(/_\d+/, id),
    }));
  } catch (err) {
    console.error("Decryption error:", err);
    return [];
  }
}

export function getBestAudioUrl(encryptedMediaUrl) {
  const links = createDownloadLinks(encryptedMediaUrl);
  if (links.length === 0) return "";
  const best = links.find((l) => l.quality === "320kbps");
  return best?.link || links[links.length - 1]?.link || "";
}
