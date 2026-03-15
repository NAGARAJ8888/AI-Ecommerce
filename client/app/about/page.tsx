import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
            alt="About NOIR"
            fill
            className="object-cover opacity-50"
          />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] mb-4 text-white">OUR STORY</h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Redefining contemporary fashion with timeless elegance and modern design.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h2 className="text-3xl font-light tracking-wide mb-6">The Essence of NOIR</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Founded in 2024, NOIR was born from a vision to create a fashion destination that celebrates minimalism, quality, and sophistication. We believe that true style is timeless, and our collections reflect this philosophy.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Every piece in our shop is carefully curated or designed to meet the highest standards of craftsmanship, ensuring that you not only look good but feel exceptional.
                </p>
              </div>
              <div className="relative aspect-square bg-secondary overflow-hidden rounded-sm">
                <Image
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"
                  alt="Craftsmanship"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-row-reverse">
              <div className="md:order-2">
                <h2 className="text-3xl font-light tracking-wide mb-6">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We strive to provide our community with more than just clothing. We offer a curated experience that inspires confidence and self-expression.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Sustainability and ethical sourcing are at the heart of what we do. We work closely with our partners to ensure that our impact on the world is as positive as the style we promote.
                </p>
              </div>
              <div className="relative aspect-square bg-secondary overflow-hidden rounded-sm md:order-1">
                <Image
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                  alt="Our Mission"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-secondary/50 text-center px-4">
          <h2 className="text-2xl md:text-3xl font-light tracking-wide mb-8">Ready to discover our collection?</h2>
          <Link href="/products">
            <Button size="lg" className="tracking-widest">
              SHOP NOW
            </Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
