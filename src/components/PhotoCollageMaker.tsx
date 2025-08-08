"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  RotateCcw,
  Download,
  Share2,
  AlertCircle,
  Info,
  Plus,
  HelpCircle,
} from "lucide-react";
import heic2any from "heic2any";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Componente per ogni singola immagine sortable
interface SortableImageProps {
  id: string;
  index: number;
  image: string | null;
  isLoading: boolean;
  progress: number;
  onImageUpload: (index: number, file: File) => void;
  onRemoveImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

// Componente wrapper per immagine con pulsante di rimozione dedicato
interface ImageWithRemoveButtonProps {
  index: number;
  image: string | null;
  isLoading: boolean;
  progress: number;
  onImageUpload: (index: number, file: File) => void;
  onRemoveImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showRemoveButton: boolean;
  isTopRow?: boolean; // true per prime 4 immagini, false per successive
  layout?: 'quadrati' | 'alternato'; // tipo di layout
}

const ImageWithRemoveButton: React.FC<ImageWithRemoveButtonProps> = ({
  index,
  image,
  isLoading,
  progress,
  onImageUpload,
  onRemoveImage,
  fileInputRef,
  showRemoveButton,
  isTopRow = true,
  layout = 'quadrati',
}) => {
  // Calcola gli stili specifici per il layout alternato
  const getAlternateLayoutStyles = () => {
    if (layout !== 'alternato') return {};
    
    const proportions = [1, 1.19, 0.81, 1];
    const totalUnits = proportions.reduce((sum, prop) => sum + prop, 0);
    const flexBasis = `${(proportions[index] / totalUnits) * 100}%`;
    
    // Nel layout alternato, solo la prima e l'ultima sono quadrate
    const aspectRatio = index === 0 || index === 3 ? "1 / 1" : "auto";
    
    return {
      flexBasis,
      aspectRatio,
      // Per slot 2 e 3, impostiamo un'altezza fissa basata sulla larghezza del primo slot
      ...(index === 1 || index === 2
        ? { height: "calc((100vw - 43.75px) / 4)" }
        : {}),
    };
  };

  const imageContainerStyles = layout === 'alternato' 
    ? {
        ...getAlternateLayoutStyles(),
        minWidth: "50px",
      }
    : {
        aspectRatio: "1 / 1",
        minWidth: "60px",
      };

  return (
    <div className="relative w-full">
      {/* Pulsante di rimozione sopra per le prime 4 immagini - posizionato fuori dal bordo */}
      {showRemoveButton && isTopRow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveImage(index);
          }}
          className="absolute -top-3 -right-1 bg-white text-black rounded-full p-1 transition-all hover:bg-gray-100 hover:scale-110 shadow-md min-w-[24px] min-h-[24px] flex items-center justify-center z-30 border border-gray-300"
          title="Rimuovi immagine"
        >
          <X size={12} />
        </button>
      )}
      
      {/* Container dell'immagine */}
      <div
        className="relative bg-white overflow-hidden transition-all duration-300 ease-out w-full"
        style={imageContainerStyles}
      >
        <SortableImage
          id={index.toString()}
          index={index}
          image={image}
          isLoading={isLoading}
          progress={progress}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          fileInputRef={fileInputRef}
        />
      </div>
      
      {/* Pulsante di rimozione sotto per le immagini successive - posizionato fuori dal bordo */}
      {showRemoveButton && !isTopRow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveImage(index);
          }}
          className="absolute -bottom-3 -right-1 bg-white text-black rounded-full p-1 transition-all hover:bg-gray-100 hover:scale-110 shadow-md min-w-[24px] min-h-[24px] flex items-center justify-center z-30 border border-gray-300"
          title="Rimuovi immagine"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

const SortableImage: React.FC<SortableImageProps> = ({
  id,
  index,
  image,
  isLoading,
  progress,
  onImageUpload,
  onRemoveImage,
  fileInputRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(index, file);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden group hover:border-blue-400 transition-colors cursor-move"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {image ? (
        <img
          src={image}
          alt={`Collage image ${index + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <div className="text-sm text-gray-600 mb-2">Caricamento...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(progress)}%
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-full p-4 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 text-center">
            Clicca per caricare
          </span>
        </div>
      )}
    </div>
  );
};

const PhotoCollageMaker = () => {
  // Esteso a 8 foto massimo
  const [images, setImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  // Stati per il drag and drop con dnd-kit
  const [activeId, setActiveId] = useState<string | null>(null);
  // Stato per il layout selezionato
  const [selectedLayout, setSelectedLayout] = useState<
    "quadrati" | "alternato"
  >("quadrati");

  // Configurazione sensori per mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  // Esteso a 8 foto
  const [loadingStates, setLoadingStates] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [loadingProgress, setLoadingProgress] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // Gestione eventi drag and drop con dnd-kit
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);

      setImages((items) => {
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const setLoadingState = (index: number, isLoading: boolean) => {
    setLoadingStates((prev) => {
      const newStates = [...prev];
      newStates[index] = isLoading;
      return newStates;
    });
  };

  const setProgress = (index: number, progress: number) => {
    setLoadingProgress((prev) => {
      const newProgress = [...prev];
      newProgress[index] = Math.min(100, Math.max(0, progress));
      return newProgress;
    });
  };

  const simulateProgress = (index: number, duration: number = 2000) => {
    const steps = 50;
    const increment = 100 / steps;
    const stepDuration = duration / steps;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += increment + Math.random() * 10;
      setProgress(index, currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setLoadingState(index, false);
          setProgress(index, 0);
        }, 200);
      }
    }, stepDuration);

    return interval;
  };

  const handleBulkUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    console.log(`🚀 CARICAMENTO MULTIPLO: ${fileArray.length} file ricevuti`);
    console.log(`📱 User Agent: ${navigator.userAgent}`);

    // Reset completo prima di caricare
    console.log("🔄 Reset completo prima del caricamento");
    setImages([null, null, null, null, null, null, null, null]);
    setLoadingStates([false, false, false, false, false, false, false, false]);
    setLoadingProgress([0, 0, 0, 0, 0, 0, 0, 0]);

    // Limita i file in base al layout selezionato
    const maxFiles = 8;
    const filesToProcess = fileArray.slice(0, maxFiles);
    console.log(`📁 File da processare: ${filesToProcess.length}`);

    // Log dettagliato dei file
    filesToProcess.forEach((file, idx) => {
      console.log(
        `📄 File ${idx + 1}: ${file.name} (${file.type}, ${file.size} bytes)`
      );
    });

    // Su iOS, il caricamento parallelo può causare problemi
    // Usiamo un caricamento sequenziale con delay maggiore
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delay = isIOS ? 500 : 200; // Delay maggiore su iOS

    console.log(
      `📱 Dispositivo iOS rilevato: ${isIOS}, usando delay: ${delay}ms`
    );

    filesToProcess.forEach((file, index) => {
      if (isValidImageFile(file)) {
        console.log(
          `⏰ Scheduling caricamento file ${index + 1} con delay ${
            index * delay
          }ms`
        );

        setTimeout(() => {
          console.log(`🚀 INIZIO caricamento file ${index + 1}: ${file.name}`);

          // Verifica che la posizione sia ancora libera
          setImages((currentImages) => {
            console.log(
              `📊 Stato corrente immagini prima di caricare ${index + 1}:`,
              currentImages.map(
                (img, i) => `${i + 1}: ${img ? "OCCUPATA" : "LIBERA"}`
              )
            );

            // Procedi con il caricamento
            handleImageUpload(index, file);
            return currentImages; // Non modificare qui, lascia che handleImageUpload gestisca
          });
        }, index * delay);
      } else {
        console.warn(`❌ File ${index + 1} non valido: ${file.name}`);
        alert(
          `File "${file.name}" non supportato. Usa JPG, PNG, HEIC, WEBP, etc.`
        );
      }
    });

    if (filesToProcess.length > 0) {
      console.log(
        `✅ Programmato caricamento di ${filesToProcess.length} immagini`
      );

      // Mostra feedback immediato all'utente
      setTimeout(() => {
        console.log("📊 Controllo stato dopo 2 secondi...");
        setImages((currentImages) => {
          const loadedCount = currentImages.filter(
            (img) => img && img !== "HEIC_PLACEHOLDER"
          ).length;
          console.log(
            `📈 Immagini caricate finora: ${loadedCount}/${filesToProcess.length}`
          );
          return currentImages;
        });
      }, 2000);
    }
  };

  const triggerBulkFileInput = () => {
    console.log("📤 APERTURA file picker per caricamento multiplo");
    console.log(
      `📱 Dispositivo: ${
        navigator.userAgent.includes("iPhone")
          ? "iPhone"
          : navigator.userAgent.includes("iPad")
          ? "iPad"
          : "Other"
      }`
    );

    const input = document.createElement("input");
    input.type = "file";

    // Per iOS, specifichiamo meglio l'accept
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      input.accept =
        "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif";
      console.log("📱 iOS rilevato, usando accept specifico per immagini");
    } else {
      input.accept = "image/*,.heic,.heif,.avif,.webp,.tiff,.tif,.bmp,.ico";
    }

    input.multiple = true;

    // Event listener con logging dettagliato
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      console.log(
        `📋 FILE PICKER RESULT: ${files?.length || 0} file selezionati`
      );

      if (!files) {
        console.log("❌ Nessun file disponibile");
        return;
      }

      // Log dettagliato di ogni file selezionato
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(
          `📄 File ${i + 1}/${files.length}: "${file.name}" (${
            file.type || "tipo sconosciuto"
          }, ${file.size} bytes)`
        );
      }

      if (files.length > 0) {
        // Controlla il limite massimo di file
        const maxFiles = 8;
        if (files.length > maxFiles) {
          console.log(
            `⚠️ Troppi file selezionati: ${files.length}, limitando a ${maxFiles} per layout ${selectedLayout}`
          );
          alert(
            `Hai selezionato ${files.length} immagini. Nel layout ${selectedLayout} verranno caricate solo le prime ${maxFiles}.`
          );
        }

        console.log(`🚀 Avvio handleBulkUpload con ${files.length} file`);
        handleBulkUpload(files);
      } else {
        console.log("❌ Nessun file selezionato dal picker");
      }
    };

    // Error handling per il file picker
    input.onerror = (error) => {
      console.error("❌ Errore nel file picker:", error);
      alert("Errore nell'apertura del selettore file. Riprova.");
    };

    // Trigger del click
    console.log("🖱️ Triggering file picker click...");
    input.click();

    // Timeout per verificare se l'utente ha annullato
    setTimeout(() => {
      if (!input.files || input.files.length === 0) {
        console.log(
          "⏰ Timeout: probabilmente l'utente ha annullato la selezione"
        );
      }
    }, 5000);
  };

  const handleImageUpload = (index: number, file: File) => {
    console.log(
      `🎯 HANDLE IMAGE UPLOAD chiamato per posizione ${index + 1} con file: ${
        file?.name
      }`
    );

    if (!file) {
      console.error(`❌ File non definito per posizione ${index + 1}`);
      return;
    }

    if (!isValidImageFile(file)) {
      console.error(
        `❌ File non valido per posizione ${index + 1}:`,
        file.name
      );
      alert("Formato file non supportato. Usa JPG, PNG, HEIC, WEBP, GIF, etc.");
      return;
    }

    console.log(
      `📷 INIZIO caricamento immagine ${index + 1}: ${file.name} (${
        file.type
      }, ${file.size} bytes)`
    );

    // Verifica che l'indice sia valido (ora fino a 8 foto)
    if (index < 0 || index > 7) {
      console.error(`❌ Indice non valido: ${index}`);
      return;
    }

    // Verifica che la posizione non sia già occupata
    setImages((currentImages) => {
      if (currentImages[index] && currentImages[index] !== "HEIC_PLACEHOLDER") {
        console.warn(
          `⚠️ Posizione ${index + 1} già occupata, sovrascrivendo...`
        );
      }

      const needsConversion =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".tiff") ||
        file.name.toLowerCase().endsWith(".tif") ||
        file.type === "image/tiff";

      if (needsConversion) {
        console.log(`🔄 File necessita conversione: ${file.name}`);
        setLoadingState(index, true);
        setProgress(index, 0);

        const progressInterval = simulateProgress(index, 1500);

        // Processa conversione dopo un piccolo delay per evitare race conditions
        const timeoutId = setTimeout(() => {
          convertImageToPNG(file, index, progressInterval);
        }, 100);
      } else {
        console.log(`📁 File standard: ${file.name}`);
        setLoadingState(index, true);
        setProgress(index, 20);

        const reader = new FileReader();

        reader.onload = (e) => {
          console.log(`✅ FileReader completato per immagine ${index + 1}`);
          setProgress(index, 100);

          setTimeout(() => {
            console.log(`🎯 Impostando immagine ${index + 1} nello stato`);
            setImages((prevImages) => {
              const newImages = [...prevImages];
              newImages[index] = e.target?.result as string;
              console.log(
                `📊 Nuovo stato immagini:`,
                newImages.map(
                  (img, i) =>
                    `${i + 1}: ${
                      img
                        ? img === "HEIC_PLACEHOLDER"
                          ? "HEIC"
                          : "CARICATA"
                        : "VUOTA"
                    }`
                )
              );
              return newImages;
            });

            setLoadingState(index, false);
            setProgress(index, 0);
            console.log(`🎉 Immagine ${index + 1} caricata con successo!`);
          }, 300);
        };

        reader.onerror = (error) => {
          console.error(
            `❌ Errore FileReader per immagine ${index + 1}:`,
            error
          );
          setLoadingState(index, false);
          setProgress(index, 0);
          alert(`Errore nel caricamento dell'immagine ${index + 1}`);
        };

        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = 20 + (e.loaded / e.total) * 60;
            setProgress(index, progress);
          }
        };

        console.log(`📖 Avvio lettura file ${index + 1} con FileReader`);
        reader.readAsDataURL(file);
      }

      return currentImages; // Non modificare lo stato qui
    });
  };

  const convertImageToPNG = async (
    file: File,
    index: number,
    progressInterval: NodeJS.Timeout
  ) => {
    try {
      console.log("Inizio conversione in PNG per:", file.name);

      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      if (isHEIC) {
        console.log("File HEIC rilevato - ambiente non supporta conversione");

        setTimeout(() => setProgress(index, 30), 200);
        setTimeout(() => setProgress(index, 60), 500);
        setTimeout(() => setProgress(index, 90), 800);

        setTimeout(() => {
          clearInterval(progressInterval);
          setLoadingState(index, false);
          setProgress(index, 0);
          showHEICAlternatives(index);
        }, 1200);

        return;
      }

      console.log("Tentativo conversione formato non-HEIC...");
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          console.log("Immagine caricata, conversione in corso...");

          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const pngDataUrl = canvas.toDataURL("image/png", 1.0);

            setTimeout(() => {
              clearInterval(progressInterval);
              setProgress(index, 100);

              setTimeout(() => {
                const newImages = [...images];
                newImages[index] = pngDataUrl;
                setImages(newImages);
                setLoadingState(index, false);
                setProgress(index, 0);
                console.log("Conversione PNG completata");
              }, 200);
            }, 500);
          } catch (canvasError) {
            console.error("Errore canvas:", canvasError);
            conversionFailed(index, progressInterval, false);
          }
        };

        img.onerror = (imgError) => {
          console.log("Caricamento immagine fallito:", imgError);
          conversionFailed(index, progressInterval, false);
        };

        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };

      reader.onerror = (readerError) => {
        console.error("FileReader fallito:", readerError);
        conversionFailed(index, progressInterval, false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Errore generale durante la conversione:", error);
      conversionFailed(index, progressInterval, false);
    }
  };

  const showHEICAlternatives = (index: number) => {
    const newImages = [...images];
    newImages[index] = "HEIC_PLACEHOLDER";
    setImages(newImages);
  };

  const conversionFailed = (
    index: number,
    progressInterval: NodeJS.Timeout,
    isHEIC: boolean = false
  ) => {
    console.error("Conversione fallita");
    clearInterval(progressInterval);
    setLoadingState(index, false);
    setProgress(index, 0);

    if (isHEIC) {
      alert(`I file HEIC non sono supportati in questo ambiente.

Soluzioni rapide:
• Converti il file in JPG sul tuo dispositivo
• Usa un convertitore online gratuito
• Su iPhone: Impostazioni > Fotocamera > Formati > Più compatibile`);
    } else {
      alert(
        "Impossibile convertire questo file. Il formato potrebbe essere corrotto o non supportato."
      );
    }
  };

  const isValidImageFile = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/tif",
      "image/ico",
      "image/heic",
      "image/heif",
      "image/avif",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];

    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
      ".tif",
      ".ico",
      ".heic",
      ".heif",
      ".avif",
      ".jfif",
      ".pjpeg",
      ".pjp",
    ];

    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (hasValidExtension) {
      return true;
    }

    if (validTypes.includes(file.type.toLowerCase())) {
      return true;
    }

    if (file.type.startsWith("image/")) {
      return true;
    }

    return false;
  };

  // Funzione per gestire il drop di file (mantenuta per compatibilità)
  const handleFileDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 1) {
      handleBulkUpload(files);
    } else if (files.length === 1) {
      handleImageUpload(index, files[0]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);

    setLoadingState(index, false);
    setProgress(index, 0);
  };

  const resetAll = () => {
    setImages([null, null, null, null, null, null, null, null]);
    setLoadingStates([false, false, false, false, false, false, false, false]);
    setLoadingProgress([0, 0, 0, 0, 0, 0, 0, 0]);
  };

  const triggerFileInput = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.heic,.heif,.avif,.webp,.tiff,.tif,.bmp,.ico";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.[0]) {
        handleImageUpload(index, files[0]);
      }
    };
    input.click();
  };

  const checkTooltipDistance = useCallback((e: MouseEvent) => {
    if (!showTooltip || !tooltipRef.current || !buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const distanceFromButton = Math.sqrt(
      Math.pow(mouseX - (buttonRect.left + buttonRect.width / 2), 2) +
        Math.pow(mouseY - (buttonRect.top + buttonRect.height / 2), 2)
    );

    const distanceFromTooltip = Math.sqrt(
      Math.pow(mouseX - (tooltipRect.left + tooltipRect.width / 2), 2) +
        Math.pow(mouseY - (tooltipRect.top + tooltipRect.height / 2), 2)
    );

    const minDistance = Math.min(distanceFromButton, distanceFromTooltip);

    if (minDistance > 100) {
      setShowTooltip(false);
    }
  }, [showTooltip]);

  useEffect(() => {
    if (showTooltip) {
      document.addEventListener("mousemove", checkTooltipDistance);
      return () => {
        document.removeEventListener("mousemove", checkTooltipDistance);
      };
    }
  }, [showTooltip, checkTooltipDistance]);

  const saveToGallery = async (format = "png") => {
    console.log(`💾 Inizio esportazione in formato ${format.toUpperCase()}`);

    try {
      const validImages = images.filter(
        (img) => img !== null && img !== "HEIC_PLACEHOLDER"
      );
      console.log(`📊 Immagini valide trovate: ${validImages.length}/4`);

      if (validImages.length === 0) {
        console.warn("❌ Nessuna immagine valida per l'export");
        alert("Carica almeno un'immagine per creare il collage!");
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("❌ Canvas non disponibile");
        alert("Errore tecnico: canvas non disponibile");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("❌ Impossibile ottenere il contesto 2D del canvas");
        alert("Errore tecnico: contesto canvas non disponibile");
        return;
      }

      const baseSize = 800;
      const spacing = 35;
      const outerBorder = 35;

      let totalWidth: number;
      let totalHeight: number;

      // Calcola dimensioni in base al layout selezionato
      const loadedImages = images.filter(
        (img) => img !== null && img !== "HEIC_PLACEHOLDER"
      ).length;

      if (selectedLayout === "quadrati") {
        if (loadedImages <= 4) {
          // Layout orizzontale per 4 o meno foto
          totalWidth =
            baseSize * Math.min(loadedImages, 4) +
            spacing * (Math.min(loadedImages, 4) - 1) +
            outerBorder * 2;
          totalHeight = baseSize + outerBorder * 2;
        } else {
          // Layout a due righe per più di 4 foto
          const firstRowCount = 4;
          const secondRowCount = Math.min(loadedImages - 4, 4);
          const maxRowWidth = Math.max(
            baseSize * firstRowCount + spacing * (firstRowCount - 1),
            baseSize * secondRowCount + spacing * (secondRowCount - 1)
          );
          totalWidth = maxRowWidth + outerBorder * 2;
          totalHeight = baseSize * 2 + spacing + outerBorder * 2;
        }
      } else {
        // Layout alternato: primo e ultimo slot quadrati, slot centrali con proporzioni variabili
        // Slot 1 e 4: quadrati (baseSize x baseSize)
        // Slot 2: +18% larghezza (baseSize * 1.18 x baseSize)
        // Slot 3: -18% larghezza (baseSize * 0.82 x baseSize)
        const slot1Width = baseSize; // Quadrato
        const slot2Width = baseSize * 1.18; // +18%
        const slot3Width = baseSize * 0.82; // -18%
        const slot4Width = baseSize; // Quadrato

        totalWidth =
          slot1Width +
          slot2Width +
          slot3Width +
          slot4Width +
          spacing * 3 +
          outerBorder * 2;
        totalHeight = baseSize + outerBorder * 2;
      }

      console.log(
        `🖼️ Layout: ${selectedLayout}, Dimensioni canvas: ${totalWidth}x${totalHeight}`
      );

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      let processedCount = 0;
      const totalToProcess = images.filter(
        (img) => img && img !== "HEIC_PLACEHOLDER"
      ).length;

      console.log(
        `🔄 Inizio processamento ${totalToProcess} immagini per layout ${selectedLayout}`
      );

      const processImage = (imageSrc: string | null, index: number) => {
        return new Promise<void>((resolve, reject) => {
          if (!imageSrc || imageSrc === "HEIC_PLACEHOLDER") {
            console.log(`⏭️ Saltando posizione ${index + 1} (vuota o HEIC)`);
            resolve();
            return;
          }

          console.log(`🎨 Processando immagine ${index + 1}`);
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            try {
              let x: number, y: number, width: number, height: number;

              if (selectedLayout === "quadrati") {
                // Layout quadrato: gestisce sia layout orizzontale che a due righe
                if (loadedImages <= 4) {
                  // Layout orizzontale per 4 o meno foto
                  x = outerBorder + index * (baseSize + spacing);
                  y = outerBorder;
                  width = baseSize;
                  height = baseSize;
                } else {
                  // Layout a due righe per più di 4 foto
                  if (index < 4) {
                    // Prima riga
                    x = outerBorder + index * (baseSize + spacing);
                    y = outerBorder;
                  } else {
                    // Seconda riga
                    const secondRowIndex = index - 4;
                    const secondRowCount = Math.min(loadedImages - 4, 4);
                    // Centra la seconda riga se ha meno di 4 foto
                    const secondRowStartX =
                      outerBorder +
                      ((4 - secondRowCount) * (baseSize + spacing)) / 2;
                    x = secondRowStartX + secondRowIndex * (baseSize + spacing);
                    y = outerBorder + baseSize + spacing;
                  }
                  width = baseSize;
                  height = baseSize;
                }
              } else {
                // Layout alternato: dimensioni specifiche per ogni slot
                const slotWidths = [
                  baseSize,
                  baseSize * 1.18,
                  baseSize * 0.82,
                  baseSize,
                ];

                // Calcola posizione X cumulativa
                let cumulativeX = outerBorder;
                for (let i = 0; i < index; i++) {
                  cumulativeX += slotWidths[i] + spacing;
                }

                x = cumulativeX;
                y = outerBorder;
                width = slotWidths[index];
                height = baseSize; // Tutti gli slot hanno la stessa altezza
              }

              const scale = Math.max(width / img.width, height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;

              const offsetX = (width - scaledWidth) / 2;
              const offsetY = (height - scaledHeight) / 2;

              if (ctx) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.clip();
                ctx.drawImage(
                  img,
                  x + offsetX,
                  y + offsetY,
                  scaledWidth,
                  scaledHeight
                );
                ctx.restore();
              }

              processedCount++;
              console.log(
                `✅ Immagine ${
                  index + 1
                } processata (${processedCount}/${totalToProcess}) - Layout: ${selectedLayout}`
              );
              resolve();
            } catch (error) {
              console.error(
                `❌ Errore nel disegno immagine ${index + 1}:`,
                error
              );
              reject(error);
            }
          };

          img.onerror = (error) => {
            console.error(
              `❌ Errore caricamento immagine ${index + 1}:`,
              error
            );
            reject(new Error(`Impossibile caricare l'immagine ${index + 1}`));
          };

          img.src = imageSrc;
        });
      };

      try {
        for (let i = 0; i < images.length; i++) {
          if (images[i]) {
            await processImage(images[i], i);
          }
        }

        console.log(`🎯 Tutte le immagini processate, inizio esportazione`);

        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        const extension = format === "jpeg" ? "jpg" : "png";
        const quality = format === "jpeg" ? 0.9 : 1.0;

        if (navigator.share && "canShare" in navigator) {
          console.log("📱 Tentativo Web Share API");

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                console.error("❌ Errore nella creazione del blob");
                fallbackDownload();
                return;
              }

              const file = new File([blob], `collage.${extension}`, {
                type: mimeType,
              });

              if (navigator.canShare({ files: [file] })) {
                try {
                  await navigator.share({
                    files: [file],
                  });
                  console.log("✅ Condivisione completata");
                  setShowTooltip(false);
                  return;
                } catch (shareError) {
                  const errorMessage =
                    shareError instanceof Error
                      ? shareError.message
                      : String(shareError);
                  const errorName =
                    shareError instanceof Error
                      ? shareError.name
                      : "UnknownError";
                  console.log("⚠️ Condivisione annullata:", errorMessage);
                  if (errorName !== "AbortError") {
                    fallbackDownload();
                  }
                  return;
                }
              } else {
                console.log("⚠️ Web Share non supporta file");
                fallbackDownload();
              }
            },
            mimeType,
            quality
          );
        } else {
          console.log("💻 Web Share non disponibile, uso download");
          fallbackDownload();
        }

        function fallbackDownload() {
          console.log("📥 Avvio download fallback");

          if (!canvas) return;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error(
                  "❌ Errore nella creazione del blob per download"
                );
                alert("Errore nella creazione del collage. Riprova.");
                return;
              }

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `collage_${Date.now()}.${extension}`;

              if (
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                  navigator.userAgent
                )
              ) {
                link.target = "_blank";
                link.rel = "noopener";
                console.log("📱 Download mobile con nuova finestra");
              }

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              setTimeout(() => URL.revokeObjectURL(url), 1000);

              setShowTooltip(false);
              console.log("✅ Download completato");
            },
            mimeType,
            quality
          );
        }
      } catch (processingError) {
        console.error("❌ Errore nel processamento:", processingError);
        alert(
          "Errore nel processamento delle immagini. Verifica che siano tutte caricate correttamente."
        );
      }
    } catch (error) {
      console.error("❌ Errore generale nell'esportazione:", error);
      alert("Errore nel salvataggio del collage. Riprova.");
    }
  };

  return (
    <div className="bg-gray-100 overflow-y-auto" style={{ height: '100dvh' }}>
      {/* Header fisso */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-2 sm:px-4 py-3 z-50">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h1 className="text-lg uppercase font-bold text-gray-800 mb-1">
              Creatore di Collage
            </h1>
            <p className="text-xs sm:text-base text-gray-600">
              Carica le immagini e trascinale per riordinarle
            </p>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Come usare"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      {/* Contenuto principale con padding top per header fisso */}
      <div className="pt-20 pb-40 min-h-screen flex flex-col justify-center items-center">



      {/* Collage Layout - SENZA PADDING, con bordo bianco come originale */}
      <div className="w-full mb-4 sm:mb-8 flex justify-center items-center">
        <div
          className="bg-white flex justify-center items-center"
          style={{
            padding: "8.75px", // Bordo bianco originale della versione 55
            width: "100%",
            maxWidth: "800px", // Larghezza massima per centrare il contenuto
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, index) => index.toString())}
              strategy={rectSortingStrategy}
            >
              {selectedLayout === "quadrati" ? (
                // Layout Quadrati - fino a 8 foto con due righe
                (() => {
                  const loadedImages = images.filter(
                    (img) => img !== null && img !== "HEIC_PLACEHOLDER"
                  ).length;

                  if (loadedImages <= 4) {
                    // Layout orizzontale per 4 o meno foto
                    return (
                      <div
                        className="flex"
                        style={{
                          gap: "8.75px",
                          width: "100%",
                          maxWidth: "calc(100vw - 17.5px)",
                        }}
                      >
                        {images.slice(0, 4).map((image, index) => (
                          <ImageWithRemoveButton
                            key={index}
                            index={index}
                            image={image}
                            isLoading={loadingStates[index]}
                            progress={loadingProgress[index]}
                            onImageUpload={handleImageUpload}
                            onRemoveImage={removeImage}
                            fileInputRef={{
                              current: fileInputRefs.current[index]!,
                            }}
                            showRemoveButton={image !== null && image !== "HEIC_PLACEHOLDER"}
                            isTopRow={true}
                          />
                        ))}
                      </div>
                    );
                  } else {
                    // Layout a due righe per più di 4 foto
                    return (
                      <div
                        className="flex flex-col"
                        style={{
                          gap: "8.75px",
                          width: "100%",
                          maxWidth: "calc(100vw - 17.5px)",
                        }}
                      >
                        {/* Prima riga - prime 4 foto */}
                        <div
                          className="flex"
                          style={{
                            gap: "8.75px",
                            width: "100%",
                          }}
                        >
                          {images.slice(0, 4).map((image, index) => (
                            <ImageWithRemoveButton
                              key={index}
                              index={index}
                              image={image}
                              isLoading={loadingStates[index]}
                              progress={loadingProgress[index]}
                              onImageUpload={handleImageUpload}
                              onRemoveImage={removeImage}
                              fileInputRef={{
                                current: fileInputRefs.current[index]!,
                              }}
                              showRemoveButton={image !== null && image !== "HEIC_PLACEHOLDER"}
                              isTopRow={true}
                            />
                          ))}
                        </div>

                        {/* Seconda riga - foto dalla 5 alla 8 */}
                        <div
                          className="flex"
                          style={{
                            gap: "8.75px",
                            width: "100%",
                          }}
                        >
                          {images.slice(4, 8).map((image, index) => {
                            const actualIndex = index + 4;
                            return (
                              <ImageWithRemoveButton
                                key={actualIndex}
                                index={actualIndex}
                                image={image}
                                isLoading={loadingStates[actualIndex]}
                                progress={loadingProgress[actualIndex]}
                                onImageUpload={handleImageUpload}
                                onRemoveImage={removeImage}
                                fileInputRef={{
                                  current: fileInputRefs.current[actualIndex]!,
                                }}
                                showRemoveButton={image !== null && image !== "HEIC_PLACEHOLDER"}
                                isTopRow={false}
                                layout="quadrati"
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                })()
              ) : (
                // Layout Alternato - proporzioni specifiche
                <div
                  className="flex"
                  style={{
                    gap: "8.75px",
                    width: "100%",
                    maxWidth: "calc(100vw - 17.5px)",
                  }}
                >
                  {images.slice(0, 4).map((image, index) => {
                    // Calcola le proporzioni per il layout alternato
                    const getFlexBasis = (index: number) => {
                      // 1° quadrata (base), 2° +19%, 3° -19%, 4° quadrata (base)
                      const proportions = [1, 1.19, 0.81, 1];
                      const totalUnits = proportions.reduce(
                        (sum, prop) => sum + prop,
                        0
                      );
                      return `${(proportions[index] / totalUnits) * 100}%`;
                    };

                    // Nel layout alternato, solo la prima e l'ultima sono quadrate
                    const getAspectRatio = (index: number) => {
                      return index === 0 || index === 3 ? "1 / 1" : "auto";
                    };

                    return (
                      <div
                        key={index}
                        style={{
                          flexBasis: getFlexBasis(index),
                          minWidth: "50px",
                        }}
                      >
                        <ImageWithRemoveButton
                          index={index}
                          image={image}
                          isLoading={loadingStates[index]}
                          progress={loadingProgress[index]}
                          onImageUpload={handleImageUpload}
                          onRemoveImage={removeImage}
                          fileInputRef={{
                            current: fileInputRefs.current[index]!,
                          }}
                          showRemoveButton={image !== null && image !== "HEIC_PLACEHOLDER"}
                          isTopRow={true}
                          layout="alternato"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div
                  className="relative bg-white overflow-hidden transition-all duration-300 ease-out"
                  style={{ aspectRatio: "1 / 1", width: "80px" }}
                >
                  {images[parseInt(activeId)] &&
                  images[parseInt(activeId)] !== "HEIC_PLACEHOLDER" ? (
                    <img
                      src={images[parseInt(activeId)]!}
                      alt={`Immagine ${parseInt(activeId) + 1}`}
                      className="w-full h-full object-cover select-none block"
                      draggable={false}
                    />
                  ) : null}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {(loadingStates.some((state) => state) ||
        images.some((img) => img && img !== "HEIC_PLACEHOLDER")) && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
            <div className="flex space-x-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    loadingStates[idx]
                      ? "bg-blue-400 animate-pulse"
                      : img && img !== "HEIC_PLACEHOLDER"
                      ? "bg-green-400"
                      : img === "HEIC_PLACEHOLDER"
                      ? "bg-orange-400"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-blue-600">
              {images.filter((img) => img && img !== "HEIC_PLACEHOLDER").length}
              /8 caricate
            </span>
          </div>
        </div>
      )}

        {/* Pulsante Carica Immagini */}
        <div className="text-center mb-4 sm:mb-6">
          <button
            onClick={triggerBulkFileInput}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium shadow-lg"
          >
            <Upload size={20} className="mr-2" />
            {(() => {
              const loadedImages = images.filter(
                (img) => img !== null && img !== "HEIC_PLACEHOLDER"
              ).length;
              const maxFiles = 8;
              return `Carica Immagini (${loadedImages}/${maxFiles})`;
            })()}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            {selectedLayout === "alternato"
              ? "Massimo 8 immagini per il layout alternato"
              : "Massimo 8 immagini per il layout quadrati"}
          </p>
        </div>


      </div>

      {/* Pulsanti fissi in fondo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        {/* Selettore Layout */}
        {(() => {
          // Conta le foto caricate
          const loadedImages = images.filter(
            (img) => img !== null && img !== "HEIC_PLACEHOLDER"
          ).length;
          // Mostra selettore sempre, indipendentemente dal numero di foto
          const showLayoutSelector = true;

          return showLayoutSelector ? (
            <div className="mb-3 text-center">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setSelectedLayout("quadrati")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayout === "quadrati"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  QUADRATI
                </button>
                <button
                  onClick={() => setSelectedLayout("alternato")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayout === "alternato"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  ALTERNATO
                </button>
              </div>
            </div>
          ) : null;
        })()}



        {/* Pulsanti Reset ed Esporta */}
        <div className="flex items-center justify-center gap-3 pb-10 max-w-md mx-auto">
          <button
            onClick={resetAll}
            className="flex items-center justify-center w-12 h-12 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
            title="Reset Tutto"
          >
            <RotateCcw size={20} />
          </button>

          <div className="relative flex-1">
            <button
              ref={buttonRef}
              onClick={() => saveToGallery("jpeg")}
              disabled={
                !images.some(
                  (img) => img !== null && img !== "HEIC_PLACEHOLDER"
                )
              }
              className="flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg text-sm font-medium"
            >
              <Download size={18} className="mr-2" />
              Esporta Collage
            </button>

            {showTooltip && (
              <div
                ref={tooltipRef}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-48"
                style={{
                  animation: "fadeIn 0.2s ease-in-out",
                }}
              >
                <div className="text-sm font-medium text-gray-800 mb-3">
                  📱 Scegli formato e salva:
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveToGallery("png")}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => saveToGallery("jpeg")}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    JPEG
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Su mobile: condividi o salva in galleria
                </p>

                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            )}
          </div>
        </div>
        
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Modale Come usare */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <HelpCircle size={24} className="mr-2 text-blue-600" />
                  Come usare l'app
                </h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Plus size={16} className="mr-2" />
                    Caricamento Immagini
                  </h3>
                  <p>
                    Clicca su <strong>"Carica Immagini"</strong> per selezionare
                    fino a 8 foto. Le immagini si posizionano automaticamente
                    nel collage.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <RotateCcw size={16} className="mr-2" />
                    Riordinamento
                  </h3>
                  <p>
                    <strong>Tieni premuto e trascina</strong> le immagini per
                    riordinarle. Su mobile vedrai "TRASCINANDO..." e "RILASCIA
                    QUI" come feedback visivo.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    Layout Disponibili
                  </h3>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • <strong>Quadrati:</strong> Disposizione a griglia (fino
                      a 8 foto)
                    </li>
                    <li>
                      • <strong>Alternato:</strong> Layout artistico (fino
                      a 8 foto)
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                    <Download size={16} className="mr-2" />
                    Esportazione
                  </h3>
                  <p>
                    Usa <strong>"Esporta Collage"</strong> per salvare il tuo
                    collage. Puoi scegliere tra formato PNG o JPEG.
                  </p>
                </div>


              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ho capito!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .overflow-x-auto {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .overflow-x-auto::-webkit-scrollbar {
          height: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default PhotoCollageMaker;
