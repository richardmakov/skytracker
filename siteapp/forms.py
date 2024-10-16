from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True, label="Nombre")
    last_name = forms.CharField(max_length=30, required=True, label="Apellido")
    email = forms.EmailField(required=True, label="Correo Electrónico")

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2']
        labels = {
            'username': 'Nombre de Usuario',
            'password1': 'Contraseña',
            'password2': 'Confirmar Contraseña',
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user


class EmailAndPasswordChangeForm(forms.Form):
    email = forms.EmailField(required=True, label='Correo Electrónico')
    new_password1 = forms.CharField(
        required=False,
        label='Nueva Contraseña',
        widget=forms.PasswordInput
    )
    new_password2 = forms.CharField(
        required=False,
        label='Confirmar Nueva Contraseña',
        widget=forms.PasswordInput
    )
    current_password = forms.CharField(
        label='Contraseña Actual',
        widget=forms.PasswordInput,
        required=True
    )

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    def clean(self):
        cleaned_data = super().clean()
        new_password1 = cleaned_data.get('new_password1')
        new_password2 = cleaned_data.get('new_password2')

        if new_password1 and new_password1 != new_password2:
            raise forms.ValidationError('Las contraseñas no coinciden')

        return cleaned_data

    def clean_current_password(self):
        current_password = self.cleaned_data.get('current_password')
        user = authenticate(username=self.user.username, password=current_password)
        if not user:
            raise forms.ValidationError('La contraseña actual es incorrecta.')
        return current_password

    def save(self, commit=True):
        email = self.cleaned_data.get('email')
        self.user.email = email
        if commit:
            self.user.save()
        return self.user
