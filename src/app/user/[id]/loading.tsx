import { Skeleton } from '@/components/ui/skeleton'

export default function UserProfileLoading() {
  return (
    <div className="container py-6 max-w-3xl">
      <Skeleton className="h-36 sm:h-48 rounded-lg mb-4" />
      <div className="flex flex-col items-center -mt-14 mb-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 mt-3 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-4 mt-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
