import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <CardDescription>
            This is your central hub for managing everything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You have successfully logged in.</p>
        </CardContent>
      </Card>
    </div>
  );
}
