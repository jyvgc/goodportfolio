export async function uploadImage(file: File, folder = "works"): Promise<string> {
  const cloudName = "djnztlzaq"; 
  const uploadPreset = "goodportfolio_unsigned";
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );


  if (!res.ok) throw new Error("이미지 업로드 실패");
  const data = await res.json();
  return data.secure_url as string;
}

export function getThumbUrl(url: string, width = 400): string {
  return url.replace("/upload/", `/upload/w_${width},h_${width},c_fill,f_auto,q_auto/`);
}
