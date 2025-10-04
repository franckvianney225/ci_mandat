# Guide d'Implémentation : Migration JWT vers Cookies HttpOnly

## 📋 Plan de Migration

### **Étape 1 : Modifier le Backend (NestJS)**

#### 1.1 Modifier `auth.controller.ts`

```typescript
// backend/src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Patch,
  Res, // Ajouter Res pour la réponse
} from '@nestjs/common';
import { Response } from 'express'; // Importer Response

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response // Injecter la réponse
  ): Promise<{ user: AuthUser }> { // Retirer access_token du retour
    const email = body.email || body.username || body.Email || body.Username;
    const password = body.password || body.Password;
    
    if (!email || !password) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    
    const loginResponse = await this.authService.login(email, password);
    
    // Définir le cookie HttpOnly sécurisé
    res.cookie('adminToken', loginResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: '/',
    });
    
    // Retourner seulement les infos utilisateur
    return { user: loginResponse.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Effacer le cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    return { message: 'Déconnexion réussie' };
  }
}
```

#### 1.2 Modifier `auth.service.ts`

```typescript
// backend/src/modules/auth/auth.service.ts
// Garder la même logique, mais adapter l'interface
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
    };
    createdAt: string;
    lastLogin?: string;
    loginAttempts: number;
  };
}
```

#### 1.3 Modifier le Guard JWT pour lire depuis les cookies

```typescript
// backend/src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Vérifier d'abord les cookies
    if (request.cookies?.adminToken) {
      request.headers.authorization = `Bearer ${request.cookies.adminToken}`;
    }
    
    return super.canActivate(context);
  }
}
```

### **Étape 2 : Modifier le Frontend (Next.js)**

#### 2.1 Modifier `src/app/ci-mandat-admin/page.tsx`

```typescript
// src/app/ci-mandat-admin/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    // Authentification avec credentials: 'include' pour envoyer les cookies
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important pour envoyer/recevoir les cookies
    });

    const data = await response.json();

    if (response.ok && data.user) {
      console.log('✅ Connexion réussie, cookie stocké automatiquement');
      // Plus besoin de stocker le token manuellement
      router.push("/ci-mandat-admin/dashboard");
    } else {
      setError(data.message || "Email ou mot de passe incorrect");
    }
  } catch (err: unknown) {
    console.error("Erreur d'authentification:", err);
    setError("Erreur de connexion au serveur. Veuillez réessayer.");
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.2 Modifier `src/lib/api.ts`

```typescript
// src/lib/api.ts
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Toujours envoyer les cookies
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== undefined) {
        return data;
      } else {
        return {
          success: true,
          data: data
        };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error occurred');
    }
  }

  // Supprimer la méthode getToken() qui lisait depuis localStorage
  // private getToken(): string | null {
  //   if (typeof window !== 'undefined') {
  //     return localStorage.getItem('adminToken');
  //   }
  //   return null;
  // }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: AuthUser }>> {
    console.log('🔐 Données envoyées au backend:', credentials);
    
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}
```

#### 2.3 Modifier `src/app/ci-mandat-admin/dashboard/page.tsx`

```typescript
// src/app/ci-mandat-admin/dashboard/page.tsx
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await apiClient.verifyToken();
      if (response.success && response.data) {
        setCurrentUser(response.data as unknown as User);
        setIsAuthenticated(true);
      } else {
        router.push("/ci-mandat-admin");
      }
    } catch (error) {
      console.error("Erreur de vérification du token:", error);
      router.push("/ci-mandat-admin");
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, [router]);
```

### **Étape 3 : Implémenter la Protection CSRF (Optionnel mais Recommandé)**

#### 3.1 Backend - Middleware CSRF

```typescript
// backend/src/middleware/csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    }
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Exclure les endpoints GET et les endpoints publics
    if (req.method === 'GET' || req.path.startsWith('/auth/login')) {
      return next();
    }
    
    this.csrfProtection(req, res, next);
  }
}
```

#### 3.2 Frontend - Gestion du Token CSRF

```typescript
// src/lib/csrf.ts
export class CsrfService {
  static async getCsrfToken(): Promise<string> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/csrf-token`, {
      credentials: 'include',
    });
    
    const data = await response.json();
    return data.csrfToken;
  }
}
```

### **Étape 4 : Configuration des Variables d'Environnement**

#### 4.1 Backend `.env`

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Cookie Configuration
COOKIE_DOMAIN=localhost
NODE_ENV=development
```

#### 4.2 Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### **Étape 5 : Tests de Sécurité**

#### 5.1 Test Manuel

1. **Connexion** : Vérifier que le cookie `adminToken` est présent avec les flags `HttpOnly` et `Secure`
2. **Requêtes API** : Vérifier que les requêtes authentifiées fonctionnent sans token dans les headers
3. **Déconnexion** : Vérifier que le cookie est bien supprimé
4. **XSS Test** : Tenter d'accéder au cookie via JavaScript (doit échouer)

#### 5.2 Script de Test Automatisé

```typescript
// tests/auth-security.test.ts
describe('JWT Cookie Security', () => {
  it('should set HttpOnly cookie on login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mandat.com', password: 'admincimandat20_25' });
    
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('Secure');
    expect(response.body.access_token).toBeUndefined(); // Pas de token dans le body
  });
});
```

## 🚨 Points d'Attention

### **Compatibilité Cross-Domain**
- En production, configurer `sameSite: 'lax'` si nécessaire
- Définir le domaine correct dans les cookies

### **Performance**
- Les cookies sont automatiquement envoyés avec chaque requête
- Pas d'impact significatif sur les performances

### **Débogage**
- Utiliser les DevTools pour vérifier les cookies
- Vérifier les headers de requête pour les cookies

## ✅ Avantages de cette Solution

1. **Sécurité renforcée** : Protection contre les attaques XSS
2. **Automatique** : Plus besoin de gérer manuellement le token
3. **Conforme aux bonnes pratiques** : OWASP recommandations
4. **Scalable** : Facile à étendre avec refresh tokens

## 🔄 Rollback Plan

Si des problèmes surviennent :

1. Revenir à l'ancienne implémentation localStorage
2. Supprimer les modifications des cookies
3. Réactiver la méthode `getToken()` dans `api.ts`

---

**Prochaine étape** : Une fois ces modifications implémentées, nous pourrons tester l'authentification sécurisée et passer aux autres points d'amélioration identifiés.