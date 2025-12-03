import { ReactNode } from "react";
import { Sparkles, FileText, Brain, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-md p-12 flex-col justify-between overflow-hidden"
        style={{
          boxShadow:
            "0 10px 30px -10px rgba(37, 99, 235), 0 4px 6px -2px rgba(59, 130, 246), 0 20px 25px -5px rgba(79, 70, 229)",
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DocuMind</span>
          </div>

          {/* Hero Text */}
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Transforme documentos em
              <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                insights inteligentes
              </span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Extraia texto de PDFs e imagens com OCR avançado e faça perguntas
              com Inteligência Artificial.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">OCR Rápido</h3>
            <p className="text-blue-100 text-sm">Extração em segundos</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center mb-3">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">IA Avançada</h3>
            <p className="text-blue-100 text-sm">Claude 3 Haiku</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/30 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">100% Grátis</h3>
            <p className="text-blue-100 text-sm">Comece agora</p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="relative z-10 text-blue-200 text-sm">
          © 2024 DocuMind • Todos os direitos reservados
        </p>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-4 shadow-lg shadow-blue-500/30">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">DocuMind</h1>
            <p className="text-sm text-gray-600">
              OCR com Inteligência Artificial
            </p>
          </div>

          {/* Form Container */}
          <div className="relative">
            {/* Decorative element */}
            <div className="absolute -top-2 -left-2 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-50" />
            <div className="absolute -bottom-2 -right-2 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50" />

            {/* Content */}
            <div className="relative bg-white">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
