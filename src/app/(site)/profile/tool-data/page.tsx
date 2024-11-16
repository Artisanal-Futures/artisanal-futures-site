import { Separator } from '~/components/ui/separator'

export default function ProfileToolDataPage() {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Tool Data Dashboard: </h3>
          <p className="text-sm text-muted-foreground">
            Manage your specific data for our suite of tools
          </p>
        </div>

        <Separator />

        <p>Coming Soon</p>
        {/* <div className="w-full space-y-8 rounded-md border border-border bg-background/50 p-4">
          <div>
            <h4 className="font-semibold">Solidarity Pathways</h4>
            <p className="text-muted-foreground">
              Manage your drivers, stops, and more.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold">Active Drivers</h5>

            <div>
              <Button>Add Single Driver</Button>
              <Button>Modify Existing</Button>
              <Button>Upload CSV</Button>
            </div>
          </div>
        </div> */}
      </div>
    </>
  )
}
