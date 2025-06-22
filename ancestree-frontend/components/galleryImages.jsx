export default function GalleryImages({ images }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
            <img src={image.imageUrl} alt="Gallery" className="w-full h-40 object-cover" />
            <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-600">
                {image.uploadedAt
                    ? new Date(image.uploadedAt._seconds * 1000).toLocaleString()
                    : 'Unknown'}
                </p>
            </div>
            </div>
        ))}
        </div>
    );
}