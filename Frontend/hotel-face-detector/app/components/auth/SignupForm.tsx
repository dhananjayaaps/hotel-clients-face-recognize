import { useState, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SignupFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    photos: File[];
  }) => Promise<void>;
  error?: string;
}

export default function SignupForm({ onSubmit, error }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setPhotos(files);
      setPreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({ ...formData, photos });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-6">Create Your Account</h1>
      {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload 3 Photos for Facial Recognition
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Select Photos
          </Button>
          <div className="flex mt-2 space-x-2">
            {previews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Preview ${index}`}
                className="w-16 h-16 object-cover rounded border"
              />
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign Up
        </Button>
      </form>
    </div>
  );
}