import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { type Slide, type SlideBackground } from '../types';

interface ExportOptions {
  filename?: string;
  scale?: number;       // rendering quality multiplier (1 = fast, 2 = better quality)
  margin?: number;      // page margins in mm
  slideWidth?: number;  // custom slide width in pixels (for accurate rendering)
  slideHeight?: number; // custom slide height in pixels
}

export async function exportPresentationToPDF(
  slides: Slide[],
  options: ExportOptions = {}
) {
  const {
    filename = 'presentation.pdf',
    scale = 2,
    margin = 10,
    slideWidth = 1400, 
    slideHeight = 720,
  } = options;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    console.log(`Rendering slide ${i + 1}/${slides.length}...`);

    // Create a temporary off-screen container to render the slide
    const tempContainer = document.createElement('div');
    Object.assign(tempContainer.style, {
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      width: `${slideWidth}px`,
      height: `${slideHeight}px`,
      background: getBackgroundCSS(slide.background),
      overflow: 'hidden',
    });

    document.body.appendChild(tempContainer);

    // Render all elements on the slide
    slide.elements.forEach((element) => {
      const elDiv = document.createElement('div');
      Object.assign(elDiv.style, {
        position: 'absolute',
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
      });

      if (element.type === 'text') {
        Object.assign(elDiv.style, {
          fontSize: `${element.fontSize}px`,
          color: element.color,
          fontFamily: element.fontFamily || 'Arial, sans-serif',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
        });
        elDiv.textContent = element.content;
      } else if (element.type === 'image') {
        const img = document.createElement('img');
        img.src = element.src;
        Object.assign(img.style, {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        });
        elDiv.appendChild(img);
      }

      tempContainer.appendChild(elDiv);
    });

    try {
      // Capture the slide as canvas
      const canvas = await html2canvas(tempContainer, {
        scale,
        useCORS: true,           // needed for external images
        logging: false,
        backgroundColor: null,
        windowWidth: slideWidth,
        windowHeight: slideHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions to fit the page while preserving aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      let pdfImgWidth = contentWidth;
      let pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

      // If image is too tall — scale it down to fit height
      if (pdfImgHeight > contentHeight) {
        pdfImgHeight = contentHeight;
        pdfImgWidth = (imgProps.width * pdfImgHeight) / imgProps.height;
      }

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imgData,
        'PNG',
        margin + (contentWidth - pdfImgWidth) / 2,   // center horizontally
        margin + (contentHeight - pdfImgHeight) / 2, // center vertically
        pdfImgWidth,
        pdfImgHeight
      );
    } catch (err) {
      console.error(`Failed to render slide ${i + 1}:`, err);
    } finally {
      // Clean up temporary DOM element
      document.body.removeChild(tempContainer);
    }
  }

  // Save the generated PDF
  pdf.save(filename);
  console.log('PDF export completed:', filename);
}

//Converts slide background definition to valid CSS background property

function getBackgroundCSS(background: SlideBackground): string {
  switch (background.type) {
    case 'color':
      return background.value;
    case 'gradient':
      return `linear-gradient(${background.value.join(', ')})`;
    case 'image':
      return `url(${background.value}) center / cover no-repeat`;
    default:
      return '#ffffff';
  }
}