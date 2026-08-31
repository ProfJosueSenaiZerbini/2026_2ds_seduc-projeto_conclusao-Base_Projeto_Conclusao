import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Header />

        <div className="flex">

          <Nav />

          <main className="
            flex-1
            min-w-0
            p-6
          ">
            {/* O conteudo vai AQUI, entre uma Main com essas tags aqui em cima*/}
          </main>

        </div>

      <Footer />
    </div>
  );
}
