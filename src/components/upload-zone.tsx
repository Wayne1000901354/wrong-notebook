"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Monitor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// 添加 CaptureController 类型声明
declare global {
    interface Window {
        CaptureController: {
            new(): {
                setFocusBehavior(behavior: 'no-focus-change' | 'focus-capturing-application'): void;
            };
        };
    }
}

interface UploadZoneProps {
    onImageSelect: (file: File) => void;  // 改为传递 File 对象
    isAnalyzing: boolean;
}

export function UploadZone({ onImageSelect, isAnalyzing }: UploadZoneProps) {
    const { t } = useLanguage();
    const [isScreenshotting, setIsScreenshotting] = useState(false);
    const [isClient, setIsClient] = useState(false);
    // 確保只在客戶端渲染螢幕截圖功能
    useEffect(() => {
        setIsClient(true);

        // 請求通知權限
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                // 直接傳遞 File 對象，讓父組件處理壓縮
                onImageSelect(file);
            }
        },
        [onImageSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
        },
        maxFiles: 1,
        disabled: isAnalyzing,
    });
    // 檢查是否支持螢幕截圖
    const isScreenshotSupported = () => {
        return isClient &&
            typeof navigator !== 'undefined' &&
            'mediaDevices' in navigator &&
            'getDisplayMedia' in navigator.mediaDevices;
    };
    // 螢幕截圖功能
    const handleScreenshot = async () => {
        if (!isScreenshotSupported()) {
            alert(t.upload.screenshotNotSupported);
            return;
        }

        setIsScreenshotting(true);

        try {
            // 創建 CaptureController 來控制焦點行為
            let controller;
            if ('CaptureController' in window) {
                controller = new window.CaptureController();
            }

            // 請求螢幕共享權限，優先當前標籤頁
            const displayMediaOptions: DisplayMediaStreamOptions & {
                preferCurrentTab?: boolean;
                controller?: any;
            } = {
                video: true,
                audio: false,
                preferCurrentTab: false,  // 優先顯示"此標籤頁"選項
            };

            if (controller) {
                (displayMediaOptions as any).controller = controller;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

            // 獲取視頻軌道並檢查捕獲類型
            const [videoTrack] = stream.getVideoTracks();
            const settings = videoTrack.getSettings();
            const displaySurface = (settings as any).displaySurface;  // 'browser' 表示標籤頁

            // 如果是標籤頁或窗口，設置不切換焦點
            if (controller && (displaySurface === 'browser' || displaySurface === 'window')) {
                try {
                    controller.setFocusBehavior('no-focus-change');  // 關鍵：不切換焦點到選中標籤頁
                    console.log('✅ 已設置不切換焦點行為');
                } catch (e) {
                    console.warn('⚠️ 無法設置焦點行為:', e);
                }
            }

            // 創建視頻元素
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;

            // 等待視頻準備並播放
            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        resolve();
                    }).catch(reject);
                };
                video.onerror = reject;
            });

            // 等待一幀渲染（確保穩定）
            await new Promise(resolve => setTimeout(resolve, 500));

            // 檢查視頻尺寸
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                throw new Error('視頻沒有有效尺寸');
            }

            // 創建canvas並捕獲
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('無法獲取canvas上下文');
            }

            // 繪製視頻幀
            ctx.drawImage(video, 0, 0);

            // 停止螢幕共享
            stream.getTracks().forEach(track => track.stop());

            // 轉換為blob並創建文件
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `screenshot-${Date.now()}.png`, {
                        type: 'image/png'
                    });
                    onImageSelect(file);
                    console.log('✅ 截圖完成，當前頁面未跳轉');
                } else {
                    alert('截圖轉換失敗');
                }
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Screenshot failed:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert(t.upload.screenshotPermissionDenied);
                } else {
                    alert(`${t.upload.screenshotFailed}: ${error.message}`);
                }
            }
        } finally {
            setIsScreenshotting(false);
        }
    };
    return (
        <div className="space-y-4">
            <Card
                {...getRootProps()}
                className={`border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
            >
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center min-h-[300px]">
                    <input {...getInputProps()} />
                    <div className="p-4 bg-muted rounded-full">
                        {isAnalyzing ? (
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        ) : (
                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                            {isAnalyzing ? t.app.analyzing : t.upload.analyze}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {isAnalyzing ? t.app.analyzing : t.app.dragDrop}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t.upload.support}
                        </p>
                    </div>
                </CardContent>
            </Card>
            {/* 螢幕截圖按鈕 - 只在客戶端渲染 */}
            {isScreenshotSupported() && (
                <div className="flex flex-col items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleScreenshot}
                        disabled={isAnalyzing || isScreenshotting}
                        className="flex items-center gap-2"
                    >
                        {isScreenshotting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Monitor className="h-4 w-4" />
                        )}
                        {isScreenshotting ? t.common.pleaseWait : t.upload.screenshot}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        {t.upload.screenshotDesc}
                    </p>
                </div>
            )}
        </div>
    );
}
