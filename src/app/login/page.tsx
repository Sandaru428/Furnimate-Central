import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(p => p.id === "login-background");

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
            <LoginForm />
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-4 text-lg font-medium">
                <Logo />
                <span className="font-headline text-2xl">Furnimate Central</span>
            </div>
            <div className="mt-auto">
                <blockquote className="space-y-2">
                <p className="text-lg">
                    &ldquo;This platform has revolutionized our workflow, bringing clarity and efficiency to every stage of our process, from procurement to delivery.&rdquo;
                </p>
                <footer className="text-sm">Sofia Davis, Production Manager</footer>
                </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
