'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DialogExample() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Ejemplo de Dialog NeoBrutalism</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Abrir Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              Esta es una prueba del componente Dialog con el tema NeoBrutalism.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Este dialog tiene el estilo característico del tema NeoBrutalism con bordes dobles y tipografía distintiva.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button variant="default">Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}