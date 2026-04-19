using FluentValidation;
using OhmERP.Application.DTOs.Auth;

namespace OhmERP.Application.Validators.Auth;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Ad alanı zorunludur.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Soyad alanı zorunludur.").MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta zorunludur.")
            .EmailAddress().WithMessage("Lütfen geçerli bir e-posta adresi giriniz.")
            .MaximumLength(150);

        RuleFor(x => x.Password)
            .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.")
            .When(x => !string.IsNullOrEmpty(x.Password));
    }
}
