import { Key } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useConfigureProvider, type ConfigureProviderTab } from "../configure-provider-context"
import { SubscriptionsCard, ApiKeysCard } from "./provider-cards"

const TABS: { id: ConfigureProviderTab; label: string }[] = [
  { id: "subscriptions", label: "Subscriptions" },
  { id: "api-keys", label: "API Keys" },
]

export function ConfigureProviderModal() {
  const { open, tab, setTab, closeConfigure } = useConfigureProvider()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeConfigure() }}>
      <DialogContent
        showCloseButton
        className="flex h-[70vh] max-h-[580px] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as ConfigureProviderTab)}
          className="flex h-full flex-col gap-0"
        >
          <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/50">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <DialogTitle>Configure Provider</DialogTitle>
                <DialogDescription>
                  Sign in with OAuth or add an API key to start chatting.
                </DialogDescription>
              </div>
            </div>

            <TabsList variant="line" className="mt-3">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <TabsContent value="subscriptions">
              <SubscriptionsCard />
            </TabsContent>
            <TabsContent value="api-keys">
              <ApiKeysCard />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
