'use client'

import { supabase } from '@lib/superbase'

function createImagePath(file: File, folder: string) {
  const rawExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const extension = rawExtension.replace(/[^a-z0-9]/g, '') || 'png'
  const safeFolder = folder.replace(/^\/+|\/+$/g, '') || 'content'
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  return `${safeFolder}/${Date.now()}-${id}.${extension}`
}

export async function uploadPostImage(file: File, folder = 'content') {
  const filePath = createImagePath(file, folder)

  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, file)

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}
