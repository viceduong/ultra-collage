use base64::Engine;
use image::GenericImageView;
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
struct ImageInfo {
    width: u32,
    height: u32,
    mime: String,
    /// base64-encoded thumbnail (256px max dimension) for the collage editor
    thumbnail: String,
}

/// Read an image file, get dimensions + a small base64 thumbnail.
/// The frontend uses this instead of URL.createObjectURL + Image probe
/// because Tauri needs a custom protocol for local file access.
#[tauri::command]
fn read_image_info(path: String) -> Result<ImageInfo, String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }

    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg")
        .to_lowercase();

    let mime = match ext.as_str() {
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/jpeg",
    }
    .to_string();

    let img = image::open(&p).map_err(|e| format!("Failed to open image: {}", e))?;
    let (width, height) = img.dimensions();

    // Generate a small thumbnail (max 256px) for the editor.
    let thumb = img.thumbnail(256, 256);
    let mut buf = std::io::Cursor::new(Vec::new());
    thumb
        .write_to(&mut buf, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(buf.into_inner());

    Ok(ImageInfo {
        width,
        height,
        mime,
        thumbnail: format!("data:image/jpeg;base64,{}", b64),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_image_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
