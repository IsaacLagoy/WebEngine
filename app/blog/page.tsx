"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import BaseModal from "@/app/components/modal/BaseModal";
import Glass from "@/app/components/Glass";
import { useAuth } from "@/app/components/auth/AuthContext";
import { app, db } from "@/lib/firebase/config";

type BlogPost = {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  youtubeUrl?: string;
  createdAt?: Timestamp | null;
};

const POSTS_PER_PAGE = 3;
const MAX_CLIENT_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_WAIT_MS = 45_000;

const isYoutubeUrl = (value: string) =>
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(value);

const toYoutubeEmbedUrl = (value: string) => {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace("www.", "");
    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
      }
      if (url.pathname.startsWith("/shorts/")) {
        const videoId = url.pathname.split("/")[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
      }
      if (url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/")[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
      }
    }
  } catch {
    return "";
  }
  return "";
};

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const canCreatePost = Boolean(user);
  const storage = useMemo(() => {
    const nextStorage = getStorage(app);
    // Fail fast on bad config/network instead of retrying for minutes.
    nextStorage.maxUploadRetryTime = 10_000;
    nextStorage.maxOperationRetryTime = 10_000;
    return nextStorage;
  }, []);

  const resetForm = () => {
    setTitle("");
    setText("");
    setYoutubeUrl("");
    setSelectedImage(null);
    setSelectedImagePreview("");
    setFormError("");
    setSubmitStatus("");
  };

  const normalizePost = (doc: QueryDocumentSnapshot<DocumentData>): BlogPost => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title ?? "",
      text: data.text ?? "",
      imageUrl: data.imageUrl ?? "",
      youtubeUrl: data.youtubeUrl ?? "",
      createdAt: data.createdAt ?? null,
    };
  };

  const fetchInitialPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const postsRef = collection(db, "posts");
      const postsQuery = query(postsRef, orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
      const snap = await getDocs(postsQuery);
      const nextPosts = snap.docs.map(normalizePost);
      setPosts(nextPosts);
      const nextLastDoc = snap.docs[snap.docs.length - 1] ?? null;
      setLastDoc(nextLastDoc);
      setHasMore(snap.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Failed to load posts:", error);
      setFormError("Could not load blog posts right now.");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
  }, []);

  const handleLoadMore = async () => {
    if (!lastDoc || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const postsRef = collection(db, "posts");
      const nextQuery = query(
        postsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE),
      );
      const snap = await getDocs(nextQuery);
      const nextPosts = snap.docs.map(normalizePost);
      setPosts((prev) => [...prev, ...nextPosts]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? lastDoc);
      setHasMore(snap.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const readAndPreviewFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please upload an image file.");
      return;
    }
    setSelectedImage(file);
    setFormError("");
    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
  };

  const uploadWithTimeout = async (blob: Blob, fileName: string) => {
    const imageRef = ref(storage, fileName);
    const task = uploadBytesResumable(imageRef, blob, { contentType: "image/webp" });

    const uploadPromise = new Promise<string>((resolve, reject) => {
      task.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          if (snapshot.totalBytes <= 0) return;
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setSubmitStatus(`Uploading image... ${percent}%`);
        },
        (error) => reject(error),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        },
      );
    });

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        task.cancel();
        reject(new Error("Image upload timed out. Check bucket config/rules and try again."));
      }, MAX_UPLOAD_WAIT_MS);
    });

    return Promise.race([uploadPromise, timeoutPromise]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreatePost || isSubmitting) return;

    const trimmedTitle = title.trim();
    const trimmedText = text.trim();
    const trimmedYoutube = youtubeUrl.trim();
    const embedUrl = trimmedYoutube ? toYoutubeEmbedUrl(trimmedYoutube) : "";

    if (!trimmedTitle || !trimmedText) {
      setFormError("Title and paragraph are required.");
      return;
    }
    if (trimmedYoutube && !embedUrl) {
      setFormError("Please provide a valid YouTube URL.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSubmitStatus("Publishing post...");

    try {
      let imageUrl = "";

      if (selectedImage) {
        if (selectedImage.size > MAX_CLIENT_UPLOAD_BYTES) {
          throw new Error("Please use an image under 5MB before compression.");
        }
        setSubmitStatus("Downscaling and converting image to WebP...");
        const compressed = await imageCompression(selectedImage, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: "image/webp",
          initialQuality: 0.8,
        });
        const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        imageUrl = await uploadWithTimeout(compressed, fileName);
      }

      setSubmitStatus("Saving post...");
      const postsRef = collection(db, "posts");
      await addDoc(postsRef, {
        title: trimmedTitle,
        text: trimmedText,
        imageUrl,
        youtubeUrl: embedUrl,
        createdAt: serverTimestamp(),
      });

      setIsModalOpen(false);
      resetForm();
      void fetchInitialPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
      setFormError("Could not publish post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12 text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Blog
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
            This is my blog.
          </p>
          {canCreatePost && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
              >
                New Post
              </button>
            </div>
          )}
        </section>

        {isLoadingPosts ? (
          <p className="text-white/70">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-white/70">No posts yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-white/15 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                  <Glass className="min-w-0 flex-1 p-5">
                    <h2 className="text-2xl font-semibold">{post.title}</h2>
                    {post.createdAt && (
                      <p className="mt-1 text-sm text-white/60">
                        {post.createdAt.toDate().toLocaleString()}
                      </p>
                    )}
                    <p className="mt-4 whitespace-pre-wrap text-white/90">{post.text}</p>
                  </Glass>

                  {(post.imageUrl || post.youtubeUrl) && (
                    <div className="w-full space-y-4 md:w-[360px] md:shrink-0">
                      {post.imageUrl && (
                        <div className="overflow-hidden">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-auto max-h-[70vh] w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {post.youtubeUrl && (
                        <div className="aspect-video overflow-hidden">
                          <iframe
                            src={post.youtubeUrl}
                            title={`YouTube video for ${post.title}`}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && posts.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="rounded-lg border border-white/25 px-4 py-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>

      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create Post"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="blog-title" className="mb-1 block text-sm text-white/80">
              Title
            </label>
            <input
              id="blog-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Post title"
              className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-blue-400"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label htmlFor="blog-text" className="mb-1 block text-sm text-white/80">
              Paragraph
            </label>
            <textarea
              id="blog-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write your post..."
              rows={7}
              className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="blog-youtube" className="mb-1 block text-sm text-white/80">
              Optional YouTube link
            </label>
            <input
              id="blog-youtube"
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-blue-400"
            />
            {youtubeUrl && !isYoutubeUrl(youtubeUrl) && (
              <p className="mt-1 text-xs text-yellow-300">
                This does not look like a YouTube URL.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm text-white/80">Optional image (drag and drop)</p>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragOver(false);
                const droppedFile = event.dataTransfer.files?.[0] ?? null;
                readAndPreviewFile(droppedFile);
              }}
              className={`block cursor-pointer rounded-md border border-dashed px-4 py-6 text-center transition ${
                isDragOver ? "border-blue-400 bg-blue-500/10" : "border-white/25 bg-black/20"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  readAndPreviewFile(nextFile);
                }}
              />
              <span className="text-sm text-white/80">
                Drop an image here, or click to browse.
              </span>
            </label>
            {selectedImagePreview && (
              <div className="mt-3 overflow-hidden rounded-md border border-white/20 bg-black/30">
                <img
                  src={selectedImagePreview}
                  alt="Preview"
                  className="max-h-64 w-full object-contain"
                />
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-red-300">{formError}</p>}
          {!formError && submitStatus && isSubmitting && (
            <p className="text-sm text-white/70">{submitStatus}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="rounded-md border border-white/30 px-4 py-2 text-white/90 transition hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </BaseModal>
    </main>
  );
}
