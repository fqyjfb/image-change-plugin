import React, { useState, useCallback, useRef, FC, ChangeEvent, KeyboardEvent, DragEvent, useEffect } from 'react';
import { Image as ImageIcon, Upload, Link, Code, Download, Eye, RefreshCw, Settings, FolderOpen } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, addToast };
};

const ToastContainer: FC<{ toasts: ToastItem[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  const colorMap: Record<string, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg text-white text-sm shadow-lg ${colorMap[toast.type] || colorMap.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

type InputType = 'local' | 'url' | 'svg';
type OutputFormat = 'png' | 'ico';

const SAMPLE_SVG = `<svg t="1764832429088" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M156.16 894.506667a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64H156.16zM746.581333 142.890667l72.192 72.192a51.2 51.2 0 0 1 0 72.192L360.96 743.466667a51.2 51.2 0 0 1-36.352 14.848H229.418667a25.6 25.6 0 0 1-25.6-25.6v-97.792a51.2 51.2 0 0 1 14.848-36.352l455.68-455.68a51.2 51.2 0 0 1 72.192 0zM267.818667 640v54.272h54.272l442.88-442.88-54.272-54.784L267.818667 640z" fill="#005FFF"></path></svg>`;

const ToolPanel: FC = () => {
  const { toasts, addToast } = useToast();
  const [inputType, setInputType] = useState<InputType>('local');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [imageUrl, setImageUrl] = useState('');
  const [svgCode, setSvgCode] = useState(SAMPLE_SVG);
  const [previewUrl, setPreviewUrl] = useState('');
  const [outputSize, setOutputSize] = useState(256);
  const [isConverting, setIsConverting] = useState(false);
  const [saveFolder, setSaveFolder] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const icoSizes = [16, 32, 48, 64, 128, 256];

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(event.target?.result as string);
      addToast({ message: `已选择文件: ${file.name}`, type: 'success' });
    };
    reader.onerror = () => {
      addToast({ message: '读取文件失败', type: 'error' });
    };
    reader.readAsDataURL(file);
  }, [addToast, previewUrl]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      addToast({ message: '请拖拽图片文件', type: 'warning' });
    }
  }, [handleFileSelect, addToast]);

  const handleUrlInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  }, []);

  const loadUrlPreview = useCallback(async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('网络请求失败');
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, []);

  const handleUrlLoad = useCallback(async () => {
    if (!imageUrl.trim()) {
      addToast({ message: '请输入图片URL', type: 'warning' });
      return;
    }

    const newPreviewUrl = await loadUrlPreview(imageUrl);
    if (newPreviewUrl) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(newPreviewUrl);
      addToast({ message: '图片加载成功', type: 'success' });
    } else {
      addToast({ message: '加载图片失败，请检查URL或网络', type: 'error' });
    }
  }, [imageUrl, addToast, previewUrl, loadUrlPreview]);

  const handleUrlKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlLoad();
    }
  }, [handleUrlLoad]);

  const loadSvgPreview = useCallback((code: string): string | null => {
    try {
      const blob = new Blob([code], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, []);

  const handleSvgPreview = useCallback(() => {
    if (!svgCode.trim()) {
      addToast({ message: '请输入SVG代码', type: 'warning' });
      return;
    }

    const newPreviewUrl = loadSvgPreview(svgCode);
    if (newPreviewUrl) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(newPreviewUrl);
      addToast({ message: 'SVG预览已更新', type: 'success' });
    } else {
      addToast({ message: '无效的SVG代码', type: 'error' });
    }
  }, [svgCode, addToast, previewUrl, loadSvgPreview]);

  const handleSvgKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSvgPreview();
    }
  }, [handleSvgPreview]);

  const getImageDimensions = useCallback((imgUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(imgUrl);
      };
      img.onerror = () => {
        resolve({ width: outputSize, height: outputSize });
      };
      img.src = imgUrl;
    });
  }, [outputSize]);

  const convertSvgToCanvas = useCallback(async (svgString: string, width: number, height: number): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建Canvas上下文');

    canvas.width = width;
    canvas.height = height;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('SVG加载失败'));
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    });
  }, []);

  const convertImageToCanvas = useCallback(async (imgUrl: string, width: number, height: number): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建Canvas上下文');

    canvas.width = width;
    canvas.height = height;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imgUrl;
    });
  }, []);

  const canvasToIco = useCallback((canvas: HTMLCanvasElement): ArrayBuffer => {
    const iconSizes = [16, 32, 48, 64, 128, 256];
    const size = Math.min(canvas.width, canvas.height);
    
    const validSizes = iconSizes.filter(s => s <= size);
    const numIcons = validSizes.length;
    
    const pngDataList: Uint8Array[] = [];
    let totalDataSize = 0;

    validSizes.forEach((iconSize) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = iconSize;
      tempCanvas.height = iconSize;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0, size, size, 0, 0, iconSize, iconSize);
      
      const pngBlob = tempCanvas.toDataURL('image/png');
      const pngBytes = atob(pngBlob.split(',')[1]);
      const pngArray = new Uint8Array(pngBytes.length);
      for (let i = 0; i < pngBytes.length; i++) {
        pngArray[i] = pngBytes.charCodeAt(i);
      }
      pngDataList.push(pngArray);
      totalDataSize += pngArray.length;
    });

    const headerSize = 6;
    const dirEntrySize = 16;
    const totalSize = headerSize + numIcons * dirEntrySize + totalDataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, numIcons, true);

    let offset = headerSize + numIcons * dirEntrySize;

    validSizes.forEach((iconSize, index) => {
      const pngData = pngDataList[index];
      const entryOffset = headerSize + index * dirEntrySize;
      
      const byteSize = iconSize === 256 ? 0 : iconSize;
      view.setUint8(entryOffset, byteSize);
      view.setUint8(entryOffset + 1, byteSize);
      view.setUint8(entryOffset + 2, 0);
      view.setUint8(entryOffset + 3, 0);
      view.setUint16(entryOffset + 4, 1, true);
      view.setUint16(entryOffset + 6, 32, true);
      view.setUint32(entryOffset + 8, pngData.length, true);
      view.setUint32(entryOffset + 12, offset, true);
      
      const dataView = new Uint8Array(buffer, offset, pngData.length);
      dataView.set(pngData);
      offset += pngData.length;
    });

    return buffer;
  }, []);

  const handleSelectSaveFolder = useCallback(async () => {
    try {
      const electronApi = (window as any).electron;
      if (electronApi && electronApi.selectFolder) {
        const result = await electronApi.selectFolder();
        if (result) {
          setSaveFolder(result);
          addToast({ message: `已选择保存目录: ${result}`, type: 'success' });
        }
      } else {
        addToast({ message: '当前环境不支持文件夹选择', type: 'warning' });
      }
    } catch (error) {
      addToast({ message: `选择目录失败: ${(error as Error).message}`, type: 'error' });
    }
  }, [addToast]);

  const saveBlobToFile = useCallback(async (blob: Blob, fileName: string): Promise<boolean> => {
    try {
      const electronApi = (window as any).electron;
      if (electronApi && electronApi.ipcRenderer && electronApi.ipcRenderer.invoke) {
        const arrayBuffer = await blob.arrayBuffer();
        const filePath = saveFolder ? `${saveFolder}/${fileName}` : `./${fileName}`;
        await electronApi.ipcRenderer.invoke('plugin:save-file', { path: filePath, data: Buffer.from(arrayBuffer) });
        addToast({ message: `文件已保存到: ${filePath}`, type: 'success' });
        return true;
      }
    } catch (error) {
      addToast({ message: `保存失败: ${(error as Error).message}`, type: 'error' });
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({ message: `图片已转换为${fileName.split('.').pop()?.toUpperCase()}并下载`, type: 'success' });
    return true;
  }, [saveFolder, addToast]);

  const handleConvert = useCallback(async () => {
    setIsConverting(true);
    try {
      let currentPreviewUrl = previewUrl;
      
      if (!currentPreviewUrl) {
        if (inputType === 'svg') {
          currentPreviewUrl = loadSvgPreview(svgCode);
          if (!currentPreviewUrl) {
            addToast({ message: '无效的SVG代码', type: 'error' });
            setIsConverting(false);
            return;
          }
        } else if (inputType === 'url') {
          currentPreviewUrl = await loadUrlPreview(imageUrl);
          if (!currentPreviewUrl) {
            addToast({ message: '加载图片失败', type: 'error' });
            setIsConverting(false);
            return;
          }
        } else {
          addToast({ message: '请先选择或加载图片', type: 'warning' });
          setIsConverting(false);
          return;
        }
      }

      let canvas: HTMLCanvasElement;
      
      if (outputFormat === 'png') {
        if (inputType === 'svg') {
          canvas = await convertSvgToCanvas(svgCode, 1024, 1024);
        } else {
          const dims = await getImageDimensions(currentPreviewUrl);
          canvas = await convertImageToCanvas(currentPreviewUrl, dims.width, dims.height);
        }
      } else {
        if (inputType === 'svg') {
          canvas = await convertSvgToCanvas(svgCode, outputSize, outputSize);
        } else {
          canvas = await convertImageToCanvas(currentPreviewUrl, outputSize, outputSize);
        }
      }

      let blob: Blob;
      let fileName: string;

      if (outputFormat === 'png') {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        fileName = `converted_${Date.now()}.png`;
      } else {
        const icoBuffer = canvasToIco(canvas);
        blob = new Blob([icoBuffer], { type: 'image/vnd.microsoft.icon' });
        fileName = `converted_${Date.now()}.ico`;
      }

      await saveBlobToFile(blob, fileName);
    } catch (error) {
      addToast({ message: `转换失败: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  }, [previewUrl, inputType, svgCode, imageUrl, outputSize, outputFormat, addToast, convertSvgToCanvas, convertImageToCanvas, canvasToIco, loadSvgPreview, loadUrlPreview, saveBlobToFile, getImageDimensions]);

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setImageUrl('');
    setSvgCode(SAMPLE_SVG);
    setSaveFolder('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast({ message: '已重置', type: 'info' });
  }, [addToast, previewUrl]);

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <ToastContainer toasts={toasts} />
      
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">图片转换</h2>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex gap-1.5">
          <button
            onClick={() => setInputType('local')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              inputType === 'local'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            本地图片
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              inputType === 'url'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            网络图片
          </button>
          <button
            onClick={() => setInputType('svg')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              inputType === 'svg'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            SVG代码
          </button>
        </div>

        <div className="flex-1 flex gap-3 overflow-hidden">
          <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
            {inputType === 'local' && (
              <div className="flex-1 flex flex-col">
                <label
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">点击或拖拽上传</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">支持 JPG、PNG、GIF、SVG</span>
                </label>
              </div>
            )}

            {inputType === 'url' && (
              <div className="flex-1 flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={handleUrlInput}
                    onKeyDown={handleUrlKeyDown}
                    className="w-full px-2.5 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="输入图片URL..."
                  />
                  <button
                    onClick={handleUrlLoad}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">按 Enter 快速加载</p>
              </div>
            )}

            {inputType === 'svg' && (
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  onKeyDown={handleSvgKeyDown}
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="粘贴SVG代码..."
                />
                <button
                  onClick={handleSvgPreview}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览 SVG
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-500">Ctrl/Cmd + Enter 预览</p>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">输出设置</span>
              </div>

              <div className="mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">输出格式</label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setOutputFormat('png')}
                    className={`flex-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      outputFormat === 'png'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => setOutputFormat('ico')}
                    className={`flex-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      outputFormat === 'ico'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    ICO
                  </button>
                </div>
              </div>

              {outputFormat === 'ico' && (
                <div className="mb-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">图标尺寸: {outputSize}px</label>
                  <div className="flex flex-wrap gap-1">
                    {icoSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setOutputSize(size)}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                          outputSize === size
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">保存目录</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={saveFolder}
                    readOnly
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs focus:outline-none"
                    placeholder="点击选择目录..."
                  />
                  <button
                    onClick={handleSelectSaveFolder}
                    className="px-1.5 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    title="选择保存目录"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs"
              >
                重置
              </button>
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-400 transition-colors text-xs"
              >
                {isConverting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isConverting ? '转换中...' : '转换并保存'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">预览</span>
                {previewUrl && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    格式: {inputType === 'svg' ? 'SVG' : outputFormat.toUpperCase()}
                    {outputFormat === 'ico' && ` | 尺寸: ${outputSize}px`}
                  </span>
                )}
              </div>
              <div
                className="w-full h-56 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500 dark:text-gray-500">暂无预览</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">请选择或加载图片</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-auto p-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">使用说明</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">1.</span>
                  <span>选择输入方式：本地图片、网络图片或SVG代码</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">2.</span>
                  <span>上传图片或输入URL/SVG代码，预览区会显示效果</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">3.</span>
                  <span>选择输出格式（PNG保持原尺寸，ICO可选择尺寸）</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">4.</span>
                  <span>选择保存目录（可选）</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">5.</span>
                  <span>点击"转换并保存"按钮完成转换</span>
                </li>
              </ul>
              
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">注意事项</h4>
                <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                  <li>- SVG代码必须包含完整的&lt;svg&gt;标签</li>
                  <li>- 网络图片需要支持跨域访问（CORS）</li>
                  <li>- PNG格式保持原图片尺寸，不进行缩放</li>
                  <li>- ICO格式会自动生成多尺寸图标（16x16~256x256）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolPanel;