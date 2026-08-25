"use server";

import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";

function hasFile(formData:FormData,name:string){
  const value=formData.get(name);
  return value instanceof File&&value.size>0;
}

export async function addGarmentWithPhotoRequirement(formData:FormData){
  if(!hasFile(formData,"product_photo")&&!hasFile(formData,"photo_front")&&!hasFile(formData,"photo_back")){
    redirect("/closet/add?error=photo_required");
  }
  return addGarment(formData);
}
