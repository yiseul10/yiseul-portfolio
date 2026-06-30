// app/blog/[slug]/edit/page.tsx
'use client'
import { useEffect, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@lib/superbase"
import { TiptapEditor } from "@/components/tiptap-editor"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2, MoveLeft, Check } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import type { Session } from '@supabase/supabase-js'
import {toast} from "sonner";
import {revalidatePost} from "@/app/blog/[slug]/actions";
import { uploadPostImage } from "@/app/blog/utils/upload-post-image.client"
import { isAdminSession } from '@lib/auth/client'

export default function EditPostPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [existingImage, setExistingImage] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [session, setSession] = useState<Session | null>(null)


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
            category: "study" as const,
        },
    })

    useEffect(() => {
        checkAuthAndLoadPost()

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (!isAdminSession(session)) {
                router.push('/login')
            }
        })

        return () => {
            authListener?.subscription.unsubscribe()
        }
    }, [slug])

    const checkAuthAndLoadPost = async () => {
        try {
            // 세션 확인
            const { data: { session } } = await supabase.auth.getSession()

            if (!isAdminSession(session)) {
                setErrorMsg("로그인이 필요합니다.")
                setSession(null)
                setIsLoading(false)
                router.push('/login')
                return
            }

            setSession(session)

            // 포스트 데이터 로드
            const { data: post, error } = await supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .single()

            if (error || !post) {
                setErrorMsg("포스트를 찾을 수 없습니다.")
                setIsLoading(false)
                return
            }

            // 폼에 기존 데이터 설정
            form.reset({
                title: post.title,
                mdx_content: post.mdx_content,
                published: post.published,
                slug: post.slug,
                tags: post.tags ? post.tags.join(', ') : '',
                category: post.category || 'experience',
            })

            setExistingImage(post.image || '')
            setIsLoading(false)
        } catch (error) {
            console.error('Error:', error)
            setErrorMsg("데이터를 불러오는 중 오류가 발생했습니다.")
            setIsLoading(false)
        }
    }

    const onSubmit = async (values: any) => {
        let imageUrl = existingImage

        // 새 이미지가 업로드된 경우
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

        const { error } = await supabase
            .from('posts')
            .update({
                title: values.title,
                mdx_content: values.mdx_content,
                published: values.published,
                slug: values.slug,
                image: imageUrl,
                tags: tagsArray,
                category: values.category,
            })
            .eq('slug', slug)

        if (error) {
            setSuccessMsg("")
            toast.error("업데이트 실패")
        } else {
            setErrorMsg("")
            toast.success("글이 성공적으로 업데이트되었습니다.")

            await revalidatePost(values.slug)

            setTimeout(() => {
                router.push(`/blog/${values.slug}`)
                router.refresh()
            }, 1000)
        }
    }

    if (isLoading) {
        return (
            <div className="w-full mx-auto max-w-xl p-6 flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isAdminSession(session)) {
        return (
            <div className="w-full mx-auto max-w-xl p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>접근 권한 없음</AlertTitle>
                    <AlertDescription>이 페이지에 접근할 권한이 없습니다.</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="editor-page w-full mx-auto">
            <Card className="text-center p-6">
                <CardHeader>
                    <CardTitle>Edit Post</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormProvider {...form}>
                        {errorMsg && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>에러</AlertTitle>
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        )}
                        {successMsg && (
                            <Alert className="mb-4">
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
                                {existingImage && !imageFile && (
                                    <div className="mb-2">
                                        <img
                                            src={existingImage}
                                            alt="Current"
                                            className="w-32 h-32 object-cover rounded"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">현재 이미지</p>
                                    </div>
                                )}
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                    />
                                </FormControl>
                                <p className="text-xs text-gray-500 mt-1">
                                    새 이미지를 업로드하지 않으면 기존 이미지가 유지됩니다.
                                </p>
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
                                        <span className="text-[13px] font-semibold">
                      {field.value ? "Post" : "Temp."}
                    </span>
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between mt-4">
                                <Button
                                    className="cursor-pointer"
                                    variant="secondary"
                                    onClick={() => router.back()}
                                >
                                    <MoveLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button className="cursor-pointer">
                                    <Check className="h-4 w-4" />
                                    Edit
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    )
}
