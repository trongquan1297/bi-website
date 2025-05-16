import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {AppHeader} from "@/components/app-header"
import {AppSidebar} from "@/components/app-sidebar"

export default function RolesLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      <Skeleton className="h-6 w-24" />
                    </CardTitle>
                    <CardDescription>
                      <Skeleton className="h-4 w-48 mt-1" />
                    </CardDescription>
                  </div>
                  <Skeleton className="h-10 w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/3" />
                  </div>

                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-12 w-1/3" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
