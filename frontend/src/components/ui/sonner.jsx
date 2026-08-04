import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-none group-[.toaster]:font-mono',
          description: 'group-[.toast]:text-white/40',
          actionButton: 'group-[.toast]:bg-[#FF4500] group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-white/5 group-[.toast]:text-white/40',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
