'use client'
import { useForm, FormProvider } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {supabase} from "@lib/superbase";
import {TiptapEditor} from "@/components/tiptap-editor";
import {Switch} from "@/components/ui/switch";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { uploadPostImage } from "@/app/blog/utils/upload-post-image.client"
import { useEffect } from "react";
import { isAdminSession } from '@lib/auth/client'

export default function Page() {
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isAdminSession(session)) router.push('/login')
    })
  }, [router])

  const schema = z.object({
    title: z.string().min(1, "required"),
    mdx_content: z.string(),
    published: z.boolean(),
    slug: z.string().min(1, "required"),
    tags: z.string().optional(),
    category: z.enum(['study', 'experience', 'diary']),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      mdx_content: "",
      published: false,
      slug: "",
      tags: "",
      category: "experience" as const,
    },
  })

  const onSubmit = async (values: any) => {
      let imageUrl = ''

      if (imageFile) {
          try {
              imageUrl = await uploadPostImage(imageFile, 'covers')
          } catch (error) {
              const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
              setErrorMsg('이미지 업로드 실패: ' + message)
              return
          }
      }

      const tagsArray = values.tags
          ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
          : []

    const { error } = await supabase.from('posts').insert({
      title: values.title,
      mdx_content: values.mdx_content,
      published: values.published,
      slug: values.slug,
      image: imageUrl,
      tags: tagsArray,
      category: values.category,
    })
    if (error) {
      setSuccessMsg("")
      setErrorMsg("업로드 실패: " + error.message)
    } else {
      setErrorMsg("")
      setSuccessMsg("글이 성공적으로 업로드되었습니다.")
        router.push(`/blog/${values.slug}`)
    }
  }

  return (
    <div className="editor-page w-full mx-auto p-6">
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle>Add Post</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>에러</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            {successMsg && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>성공</AlertTitle>
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 text-left">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>title</FormLabel>
                    <FormControl>
                      <Input placeholder="title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>slug</FormLabel>
                            <FormControl>
                                <Input placeholder="slug" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

              <FormField
                control={form.control}
                name="mdx_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>content</FormLabel>
                    <FormControl>
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        uploadImage={(file) => uploadPostImage(file, 'content')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

                <FormItem>
                    <FormLabel>타이틀 이미지</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        />
                    </FormControl>
                </FormItem>

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>태그 (쉼표로 구분)</FormLabel>
                            <FormControl>
                                <Input placeholder="ex) tag1, tag2" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="study">Study</option>
                        <option value="experience">Experience</option>
                        <option value="diary">Diary</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormLabel className="text-[13px]">공개여부</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <span className="text-[13px] font-semibold">{field.value ? "Post" : "Temp."}</span>
                  </FormItem>
                )}
              />

              <Button>submit</Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
